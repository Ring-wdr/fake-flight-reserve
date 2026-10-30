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
    const raw = JSON.parse(localStorage.getItem("ffr-state-v3"));
    raw.site = s; raw.listing = null; raw.notice = null;
    localStorage.setItem("ffr-state-v3", JSON.stringify(raw));
    location.hash = "/ota/list";
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

// 모바일 가로 넘침
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 800, deviceScaleFactor: 2, mobile: true });
await page.click(".panel-head .icon-btn");
const overflow = {};
for (const site of ["faretrap", "voyagate", "pinefly"]) {
  await page.evaluate((s) => {
    const raw = JSON.parse(localStorage.getItem("ffr-state-v3"));
    raw.site = s; raw.order = { ...raw.order, site: s };
    localStorage.setItem("ffr-state-v3", JSON.stringify(raw));
    location.hash = "/ota/passenger";
    location.reload();
  }, site);
  await page.waitForSelector(".o-sample", { timeout: 8000 });
  await wait(300);
  overflow[site] = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await page.screenshot({ path: `${ROOT}/mobile-${site}.png` });
}
for (const r of ["/", "/results", "/booking/f1", "/ota/list", "/mail"]) {
  await page.evaluate((h) => { location.hash = h; }, r);
  await wait(1800);
  overflow[r] = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
}
out.overflow = overflow;
console.log(JSON.stringify(out, null, 1));
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await task.finish({ keep: [] });
