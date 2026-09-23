# Stock Signal v2

무료 개인용 주식/시장 지표 대시보드입니다.

## v2 변경사항
- MOKA 계열의 편집디자인 감성을 참고한 레이아웃(복제 아님)
- 시장 지표와 종목 지표 분리
- 각 지표 옆에 짧고 쉬운 설명 추가
- 종목 가격 차트 추가: 1M / 6M / 1Y / 5Y
- S&P 500 MDD 기준을 종목 낙폭과 분리
- 200일선 대비 거리(%) 표시
- 관심종목 로컬 저장

## Render
- Language: Node
- Build Command: `npm install`
- Start Command: `node server.js`
- Root Directory: 비워두기 (이 폴더의 파일을 저장소 최상단에 올렸을 때)

## 비용
API 키가 필요 없는 무료 데이터 방식입니다. 무료 데이터는 지연/차단/형식 변경 가능성이 있습니다.
Fear & Greed는 안정적인 무료 공식 데이터 연결 전까지 준비 중으로 표시합니다.

## v3 UI update
- 첫 화면에서 핵심 지표 6개가 바로 보이도록 레이아웃 압축
- STOCK SIGNAL/종목명 영역 축소
- 핵심 조건 요약을 지표 바로 위로 이동
- 파스텔 지표 카드 적용
- 지표 값의 시각적 우선순위 강화
- Fear & Greed는 안정적인 무료 데이터가 없어 핵심 조건 집계에서 제외

## v6 color semantics
- Price change: positive = deep pink (#D94F7D), negative = navy (#253858).
- Condition metrics: condition met = deep pink, condition unmet = navy.
- Pastel card backgrounds remain unchanged.


## v7 변경사항
- Fear & Greed Graph의 무료 공개 JSON 엔드포인트를 서버에서 조회해 Fear & Greed 카드에 표시합니다. API 키가 필요 없습니다.
- Fear & Greed를 핵심 조건 집계에 포함해 6개 조건으로 표시합니다.
- 가격 일일 등락률은 2년 범위 시작가가 아니라 직전 일봉 종가와 비교하도록 수정했습니다.

## v10 UI update
- 데스크톱 핵심 지표를 동일 크기의 3열 × 2행 카드로 고정했습니다.
- 카드 순서: Fear & Greed → VIX → RSI 14 → 검색 종목 200일 이동평균 → S&P 500 MDD → S&P 500 200일 이동평균.
- S&P 500 관련 카드는 뒤쪽 두 칸에 연속 배치했습니다.
- Fear & Greed 게이지는 동일 크기 카드 안에 유지합니다.


## v11 변경사항
- 가격 영역에 수동 새로고침 버튼 추가
- Fear & Greed 게이지 축소 및 카드 내부 잘림 방지
- Fear & Greed는 숫자보다 상태(FEAR / EXTREME FEAR / NEUTRAL / GREED / EXTREME GREED)를 크게 표시
- 200일 이동평균 카드는 최신 가격과 일봉 종가를 구분해 표기
- 3×2 동일 크기 카드 레이아웃 유지
