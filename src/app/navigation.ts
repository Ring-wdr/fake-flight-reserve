// 상태 모듈이 라우터를 직접 import하면 순환 참조가 생기므로, 이동 함수만 주입받는다.
let navigate: (to: string) => void = (to) => {
  location.hash = to;
};

export const bindNavigate = (fn: (to: string) => void) => {
  navigate = fn;
};

export const go = (to: string) => navigate(to);
