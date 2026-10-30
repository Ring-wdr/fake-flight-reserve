// 영상에 담기지 않은 분기와 모바일 레이아웃을 확인한다.
const task = await taskSpace("dark pattern verify");
const page = task.page("p1");
const URL = "http://localhost:5199/";
const ROOT = "/path/to/fake-flight-reserve/evidence";
const out = {};
const wait = (ms = 700) => page.waitForTimeout(ms);
const setScenario = async (id) => {
  await page.selectOption("#scenario", id);
  await wait();
};
const toCheckoutOrModal = async () => {
  await page.click("text=검색");
  await wait();
  await page.click('button[aria-label^="한빛항공"]');
  await wait(300);
  await page.click('text="항공편 선택"');
  await wait();
  await page.click(".g-sellers .g-primary");
  await wait();
  await page.click("text=샘플 데이터 채우기");
  await page.click(".o-pay");
  await wait(300);
  await page.click('text="필요 없음"');
  await wait(3200);
};

await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
await page.goto(URL);
await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); location.hash = "/"; location.reload(); });
await wait(1500);

// 가격 변동: 1회차 결제 분기, 2회차 목록 강제 이동
await setScenario("price");
await toCheckoutOrModal();
out.priceFirst = await page.evaluate(() => document.querySelector('[role=alertdialog]')?.getAttribute("aria-label"));
await page.click("text=다른 항공편 보기");
await wait();
out.priceFirstNotice = await page.evaluate(() => document.querySelector(".g-notice")?.innerText);
await page.click('a.g-logo');
await wait();
await toCheckoutOrModal();
out.priceSecond = await page.evaluate(() => document.querySelector('[role=alertdialog]')?.getAttribute("aria-label"));
await page.click("text=항공편 목록으로");
await wait();
out.priceSecondUrl = await page.url();

// 타이머 초기화 + 가짜 확정 메일 지연
await setScenario("confirm");
await toCheckoutOrModal();
await page.waitForTimeout(4000);
const timer = () => page.evaluate(() => document.querySelector(".o-timer")?.innerText);
out.timerBefore = await timer();
await page.reload();
await wait(1000);
out.timerAfterReload = await timer();
await page.click("text=샘플 카드 채우기");
await page.click(".o-pay");
await page.waitForSelector(".ok", { timeout: 8000 });
await page.click('button:has-text("+3일")');
await wait();
await page.click('button:has-text("메일")');
await wait();
out.confirmMails = await page.evaluate(() => [...document.querySelectorAll(".m-list li.unread .m-subj b")].map((x) => x.innerText));
await page.screenshot({ path: `${ROOT}/21-delay-inbox.png` });

// 모바일 가로 넘침
const overflow = {};
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 800, deviceScaleFactor: 2, mobile: true });
await page.click(".panel-head .icon-btn");
for (const r of ["/", "/results", "/booking/f1", "/ota/passenger", "/ota/support", "/mail"]) {
  await page.evaluate((h) => { location.hash = h; }, r);
  await wait();
  overflow[r] = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
}
out.overflow = overflow;
await page.evaluate(() => { location.hash = "/results"; });
await wait();
await page.screenshot({ path: `${ROOT}/22-mobile-results.png` });
console.log(JSON.stringify(out, null, 1));
await page.cdp("Emulation.clearDeviceMetricsOverride", {});
await task.finish({ keep: [] });
