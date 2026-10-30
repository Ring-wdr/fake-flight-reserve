// 검색 입력의 가격 반영, 스켈레톤, 영상에 없는 분기, 모바일 레이아웃을 확인한다.
const task = await taskSpace("dark pattern verify");
const page = task.page("p1");
const SITE_URL = "http://localhost:5199/";
const ROOT = "/path/to/fake-flight-reserve/evidence";
const out = {};
const wait = (ms = 700) => page.waitForTimeout(ms);
const ready = () => page.waitForSelector('button[aria-label^="한빛항공"]', { state: "visible", timeout: 8000 });
const price = async () => {
  await wait(100);
  const skeleton = await page.evaluate(() => document.querySelectorAll(".g-list .sk").length);
  await ready();
  const value = await page.evaluate(() => document.querySelector('button[aria-label^="한빛항공"] .g-price').innerText.split("\n")[0]);
  return { value, skeleton };
};

await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
await page.goto(SITE_URL);
await page.evaluate(() => { localStorage.clear(); location.hash = "/results"; location.reload(); });
await wait(300);
const prices = { base: await price() };
await page.click('[aria-label^="승객"]');
await page.click('[aria-label="성인 늘리기"]');
prices.twoAdults = await price();
await page.click('[aria-label="어린이 늘리기"]');
prices.plusChild = await price();
await page.click('[aria-label="유아 늘리기"]');
prices.plusInfant = await price();
await page.click(".g-pax-done");
await page.selectOption('[aria-label="좌석 등급"]', "business");
prices.business = await price();
await page.selectOption('[aria-label="여정 유형"]', "round");
prices.round = await price();
await page.selectOption('[aria-label="목적지"]', "NRT");
prices.routeNrt = await price();
await page.evaluate(() => {
  const el = document.querySelector('[aria-label="출발일"]');
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, "2026-12-25");
  el.dispatchEvent(new Event("input", { bubbles: true }));
});
prices.peakDate = await price();
out.prices = prices;

// 왕복 예약 합계가 결과 목록과 판매처까지 이어지는지 확인한다.
await page.click('button[aria-label^="한빛항공"]');
await wait(200);
await page.click('text="항공편 선택"');
await ready();
const roundPrice = await page.evaluate(() => document.querySelector('button[aria-label^="푸른하늘항공"] .g-price').innerText.split("\n")[0]);
await page.click('button[aria-label^="푸른하늘항공"]');
await wait(200);
await page.click('text="항공편 선택"');
await page.waitForSelector('.g-primary[data-site="faretrap"]:not([disabled])', { timeout: 8000 });
out.roundTrip = { resultPrice: roundPrice, sellerPrice: await page.evaluate(() => document.querySelector(".g-seller-price").innerText) };

// 강제 시나리오: 가격 변동은 판매처와 상관없이 번갈아 발동한다.
await page.selectOption("#scenario", "price");
await wait();
const toGate = async (site) => {
  await page.click(".g-explore");
  await ready();
  await page.click('button[aria-label^="한빛항공"]');
  await wait(200);
  await page.click('text="항공편 선택"');
  await page.waitForSelector(`.g-primary[data-site="${site}"]:not([disabled])`, { timeout: 8000 });
  await page.click(`.g-primary[data-site="${site}"]`);
  await page.waitForSelector(".o-sample", { timeout: 8000 });
  await page.click("text=샘플 데이터 채우기");
  await page.click(site === "voyagate" ? ".v-bar .o-pay" : ".o-pay");
};
const dialog = () => page.evaluate(() => document.querySelector("[role=alertdialog]")?.getAttribute("aria-label"));
await toGate("faretrap");
await wait(300);
await page.click('text="필요 없음"');
await page.waitForSelector("[role=alertdialog]", { timeout: 6000 });
out.forcedFirst = await dialog();
await page.click("text=다른 항공편 보기");
await page.waitForSelector(".sl-row button", { timeout: 8000 });
out.afterPriceChange = await page.url();
await page.click('.sl-row button[data-airline="한빛항공"]');
await page.waitForSelector(".o-sample", { timeout: 8000 });
await page.click("text=샘플 데이터 채우기");
await page.click(".o-pay");
await wait(300);
await page.click('text="필요 없음"');
await page.waitForSelector("[role=alertdialog]", { timeout: 6000 });
out.forcedSecond = await dialog();
await page.click("text=항공편 목록으로");
await page.waitForSelector(".sl-row button", { timeout: 8000 });
out.afterSoldOut = await page.url();

// 판매사 목록 검색: 판매처마다 같은 로직으로 기준가 이상만 나오고, 기준가 포함은 무작위다.
const stats = {};
for (const site of ["faretrap", "voyagate", "pinefly"]) {
  await page.evaluate((s) => {
    const raw = JSON.parse(localStorage.getItem("ffr-state-v4"));
    raw.listing = null; raw.notice = null;
    localStorage.setItem("ffr-state-v4", JSON.stringify(raw));
    location.hash = `/sites/${s}/list`;
    location.reload();
  }, site);
  const r = { included: 0, excluded: 0, belowAnchor: 0, wrongAnchorCount: 0, anchors: new Set() };
  for (let i = 0; i < 8; i++) {
    await wait(100);
    await page.waitForSelector(".sl-row button", { timeout: 8000 });
    const v = await page.evaluate(() => {
      const l = document.querySelector(".sl-list");
      return { anchor: +l.dataset.anchor, inc: l.dataset.anchorIncluded === "true", prices: [...document.querySelectorAll(".sl-price")].map((p) => +p.dataset.price) };
    });
    r[v.inc ? "included" : "excluded"]++;
    r.belowAnchor += v.prices.filter((p) => p < v.anchor).length;
    const atAnchor = v.prices.filter((p) => p === v.anchor).length;
    if (atAnchor !== (v.inc ? 1 : 0)) r.wrongAnchorCount++;
    r.anchors.add(v.anchor);
    await page.click(".sl-search");
  }
  r.anchors = [...r.anchors];
  stats[site] = r;
}
out.listStats = stats;
// 재검색 조건이 기준가에 반영되는지 확인한다.
await wait(100);
await page.waitForSelector(".sl-row button", { timeout: 8000 });
const anchorNow = () => page.evaluate(() => +document.querySelector(".sl-list").dataset.anchor);
const a1 = await anchorNow();
await page.selectOption('.o-search [aria-label="좌석 등급"]', "business");
await page.click(".sl-search");
await wait(100);
await page.waitForSelector(".sl-row button", { timeout: 8000 });
out.researchBusiness = { economy: a1, business: await anchorNow() };

// 정상 판매처: 강제 시나리오에서도 가격이 일정하고 수법이 발동하지 않는다.
await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem("ffr-state-v4"));
  raw.listing = null; raw.notice = null; raw.search = { ...raw.search, cabin: "economy" };
  localStorage.setItem("ffr-state-v4", JSON.stringify(raw));
  location.hash = "/sites/truefare/list";
  location.reload();
});
await wait(100);
await page.waitForSelector(".sl-row button", { timeout: 8000 });
const tfPrices = () => page.evaluate(() => [...document.querySelectorAll(".sl-price")].map((p) => +p.dataset.price).join());
const tf1 = await tfPrices();
await page.click(".sl-search");
await wait(100);
await page.waitForSelector(".sl-row button", { timeout: 8000 });
const tf = { stablePrices: tf1 === (await tfPrices()), seatsShown: await page.evaluate(() => document.querySelectorAll(".sl-seats").length) };
await page.click('.sl-row button[data-airline="한빛항공"]');
await page.waitForSelector(".o-sample", { timeout: 8000 });
tf.preselected = await page.evaluate(() => [...document.querySelectorAll(".o-extra input")].filter((i) => i.checked).length);
await page.click("text=샘플 데이터 채우기");
const shown = await page.evaluate(() => document.querySelector("[data-testid=total]").innerText);
await page.click(".o-pay");
await page.waitForSelector('text="결제 방법을 선택하세요"', { timeout: 8000 });
await wait(1400);
tf.priceChanged = await page.evaluate(() => !!document.querySelector(".o-line.up"));
tf.sameTotal = shown === (await page.evaluate(() => document.querySelector("[data-testid=total]").innerText));
tf.timer = await page.evaluate(() => !!document.querySelector(".o-timer"));
await page.click("text=결제하지 않고 나가기");
await wait();
tf.lureScheduled = await page.evaluate(() => JSON.parse(localStorage.getItem("ffr-state-v4")).scheduled.length);
out.truefare = tf;

// 네 판매처 가격 순서
await page.evaluate(() => { location.hash = "/booking/f1"; });
await page.waitForSelector('.g-primary[data-site="truefare"]:not([disabled])', { timeout: 8000 });
out.sellers = await page.evaluate(() => [...document.querySelectorAll(".g-sellers li")].slice(0, 4).map((l) => l.innerText.replace(/\n/g, " ")));
await page.selectOption("#scenario", "fake");
await wait();
await page.evaluate(() => { location.hash = "/"; });
await wait();

// 타이머 초기화
await toGate("faretrap");
await wait(300);
await page.click('text="필요 없음"');
await page.waitForSelector(".o-timer", { timeout: 8000 });
await page.waitForTimeout(4000);
const timer = () => page.evaluate(() => document.querySelector(".o-timer")?.innerText);
out.timerBefore = await timer();
await page.reload();
await page.waitForSelector(".o-timer", { timeout: 8000 });
out.timerAfterReload = await timer();

// 라우터: 없는 판매처와 flow에 없는 단계는 안전한 곳으로 돌려보낸다.
const landed = async (hash) => {
  await page.evaluate((h) => { location.hash = h; }, hash);
  await wait(500);
  return page.evaluate(() => location.hash);
};
out.routes = {
  unknownSite: await landed("/sites/nope/list"),
  unknownPath: await landed("/nope"),
  stepNotInFlow: await landed("/sites/faretrap/book/seat"),
  siteIndex: await landed("/sites/voyagate"),
  twoSegmentBooking: await landed("/booking/f1/f2"),
};

// 모바일 가로 넘침
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 800, deviceScaleFactor: 2, mobile: true });
await page.click(".panel-head .icon-btn");
const overflow = {};
for (const site of ["faretrap", "voyagate", "pinefly", "truefare"]) {
  await page.evaluate((s) => {
    const raw = JSON.parse(localStorage.getItem("ffr-state-v4"));
    raw.order = { ...raw.order, site: s };
    localStorage.setItem("ffr-state-v4", JSON.stringify(raw));
    location.hash = `/sites/${s}/book/passenger`;
    location.reload();
  }, site);
  await page.waitForSelector(".o-sample", { timeout: 8000 });
  await wait(300);
  overflow[site] = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await page.screenshot({ path: `${ROOT}/mobile-${site}.png` });
}
for (const r of ["/", "/results", "/booking/f1", "/sites/pinefly/list", "/mail"]) {
  await page.evaluate((h) => { location.hash = h; }, r);
  await wait(1800);
  overflow[r] = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
}
out.overflow = overflow;

// 모바일 승객 시트: 모든 버튼이 화면 안에 있고 실제로 눌린다.
const sheet = {};
for (const [name, hash, scope] of [["meta", "/", ""], ["seller", "/sites/pinefly/list", ".o-search "]]) {
  await page.evaluate((h) => { location.hash = h; }, hash);
  await wait(1800);
  await page.evaluate((sc) => window.scrollTo(0, document.querySelector(`${sc}.g-pax`).getBoundingClientRect().top + scrollY - 200), scope);
  await wait(200);
  await page.click(`${scope}[aria-label^="승객"]`);
  await wait(300);
  const before = await page.evaluate(() => document.querySelector('[aria-label^="성인 "][aria-label$="명"]').innerText);
  await page.click(`${scope}[aria-label="성인 늘리기"]`);
  await wait(200);
  const r = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll(".g-pax-pop button")].map((b) => b.getBoundingClientRect());
    return {
      allVisible: boxes.every((b) => b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight),
      minTouch: Math.min(...boxes.map((b) => b.height)),
      adults: document.querySelector('[aria-label^="성인 "][aria-label$="명"]').innerText,
    };
  });
  sheet[name] = { before, ...r };
  if (name === "meta") await page.screenshot({ path: `${ROOT}/mobile-passenger-sheet.png` });
  await page.click(".g-pax-done");
  await wait(200);
}
out.sheet = sheet;
console.log(JSON.stringify(out, null, 1));
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await task.finish({ keep: [] });
