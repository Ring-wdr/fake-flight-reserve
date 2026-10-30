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
await wait();
await page.click("a.g-logo");
await wait();
await toGate("faretrap");
await wait(300);
await page.click('text="필요 없음"');
await page.waitForSelector("[role=alertdialog]", { timeout: 6000 });
out.forcedSecond = await dialog();

// 타이머 초기화
await page.selectOption("#scenario", "fake");
await wait();
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
    const raw = JSON.parse(localStorage.getItem("ffr-state-v2"));
    raw.order = { ...raw.order, site: s };
    localStorage.setItem("ffr-state-v2", JSON.stringify(raw));
    location.hash = "/ota/passenger";
    location.reload();
  }, site);
  await page.waitForSelector(".o-sample", { timeout: 8000 });
  await wait(300);
  overflow[site] = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await page.screenshot({ path: `${ROOT}/mobile-${site}.png` });
}
for (const r of ["/", "/results", "/booking/f1", "/ota/enter", "/mail"]) {
  await page.evaluate((h) => { location.hash = h; }, r);
  await wait(1800);
  overflow[r] = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
}
out.overflow = overflow;
console.log(JSON.stringify(out, null, 1));
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await task.finish({ keep: [] });
