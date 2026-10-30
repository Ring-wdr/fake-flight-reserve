// 전체 여정을 ego browser로 재현하며 프레임을 저장한다. 사용법은 README 참고.
const { mkdir, rm, writeFile } = await import("node:fs/promises");

const ROOT = "/path/to/fake-flight-reserve/evidence";
const FRAMES = `${ROOT}/frames`;
const URL = "http://localhost:5199/";

await rm(FRAMES, { recursive: true, force: true });
await mkdir(FRAMES, { recursive: true });

const task = await taskSpace("dark pattern replay");
const page = task.page("p1");
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });

let n = 0;
let recording = true;
const stamps = [];
const recorder = (async () => {
  while (recording) {
    const file = `${FRAMES}/${String(n).padStart(5, "0")}.png`;
    await page.screenshot({ path: file });
    stamps.push({ file, t: Date.now() });
    n++;
  }
})();

const steps = [];
const pause = (ms = 1400) => page.waitForTimeout(ms);
const click = async (sel, label) => {
  await page.click(sel, { label });
  await pause();
};
const shot = async (name) => {
  await page.screenshot({ path: `${ROOT}/${name}.png` });
  steps.push(name);
};

await page.goto(URL);
await page.evaluate(() => {
  localStorage.clear();
  sessionStorage.clear();
  location.hash = "/";
  location.reload();
});
await pause(2000);
await page.click(".panel-check input", { label: "turn on annotations" });
await pause();
await shot("01-search");
await click("text=검색", "search flights");
await page.click('button[aria-label^="한빛항공"]', { label: "open flight details" });
await pause();
await shot("02-results-9-seats");
await click('text="항공편 선택"', "select the flight");
await shot("03-sellers");
await click('.g-sellers .g-primary', "continue to agency");
await page.waitForSelector(".o-sample");
await shot("04-passenger-blank");
await click("text=샘플 데이터 채우기", "fill sample passport");
await shot("05-passenger-filled");
await click('.o-pay', "press pay");
await shot("06-upsell");
await page.click('text="필요 없음"', { label: "decline upsell" });
await page.waitForSelector('[aria-label="가격 변동"]', { timeout: 8000 });
await pause();
await shot("07-price-change");
await click("text=변동된 가격으로 계속", "accept changed price");
await shot("08-checkout-hidden-fees");
await click("text=결제하지 않고 나가기", "leave checkout");
await click('button:has-text("+15분")', "skip fifteen minutes");
await shot("09-lure-toast");
await click('button:has-text("메일")', "open inbox");
await shot("10-inbox-lure");
await click(".m-list li.unread a", "open lure mail");
await shot("11-lure-mail");
await click(".m-cta", "press original price link");
await shot("12-gone");
await page.waitForSelector(".g-notice", { timeout: 9000 });
await pause();
await shot("13-back-to-list");
await page.click('button[aria-label^="푸른하늘항공"]', { label: "try another flight" });
await pause();
await click('text="항공편 선택"', "select the flight");
await click('.g-sellers .g-primary', "continue to agency");
await click("text=샘플 데이터 채우기", "fill sample passport");
await click('.o-pay', "press pay");
await page.click('text="필요 없음"', { label: "decline upsell" });
await page.waitForSelector(".o-timer", { timeout: 8000 });
await pause();
await click("text=샘플 카드 채우기", "fill sample card");
await shot("14-checkout-second");
await page.click('.o-pay', { label: "pay" });
await page.waitForSelector(".ok", { timeout: 8000 });
await pause(1800);
await shot("15-paid");
await click('button:has-text("메일")', "open inbox");
await click(".m-list li.unread a", "open confirmation mail");
await shot("16-confirmation-mail");
await click(".m-cta", "check with airline");
await click(".l-main button", "lookup at airline");
await shot("17-airline-not-found");
await click('button:has-text("+3시간")', "skip three hours");
await pause(1200);
await shot("18-cancel-sms");
await click('button:has-text("메일")', "open inbox");
await click(".m-list li.unread a", "open cancel mail");
await shot("19-cancel-mail");
await click(".m-cta", "contact support");
await click(".o-quick button:has-text(\"상담원 연결\")", "ask for human");
await pause(900);
await click(".o-quick button:has-text(\"환불 일정\")", "ask about refund");
await pause(1000);
await shot("20-support-bot");

recording = false;
await recorder;
const lines = [];
stamps.forEach((s, i) => {
  const d = i + 1 < stamps.length ? (stamps[i + 1].t - s.t) / 1000 : 2;
  lines.push(`file '${s.file}'`, `duration ${d.toFixed(3)}`);
});
lines.push(`file '${stamps[stamps.length - 1].file}'`);
await writeFile(`${ROOT}/frames.txt`, lines.join("\n"));
await writeFile(`${ROOT}/steps.json`, JSON.stringify(steps, null, 2));
console.log({ frames: n, steps: steps.length, url: await page.url() });
await task.finish({ keep: [] });
