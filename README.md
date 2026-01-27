# 올인원 계산기 모음

사내 업무용 계산기를 한 곳에서 제공하는 Vite + React + TypeScript 앱입니다.

## 시작하기

1) 의존성 설치
```
npm install
```

2) Firebase 설정
- Firebase 프로젝트를 만들고 **Authentication**에서 Email/Password를 활성화합니다.
- Google 로그인을 쓰려면 Google 공급자를 활성화합니다.
- Firestore를 활성화합니다.
- 웹 앱을 추가하고 제공된 구성값을 `.env`에 입력합니다.

### 로그인/구글 설정 체크리스트
- Authentication → Sign-in method → Email/Password 활성화
- Authentication → Sign-in method → Google 활성화 (필요 시 지원 이메일 설정)
- Authentication → Settings → Authorized domains에 현재 도메인 추가
- Project settings → General → Your apps → Web app 설정값 확인

3) 환경 변수 설정
- `.env.example`를 복사해 `.env`를 만들고 값을 채웁니다.

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4) 실행
```
npm run dev -- --host 0.0.0.0 --port 5173
```

## 기능 요약
- 기본 계산기(사칙연산/괄호) + 숫자 콤마 + 한글 읽기
- 퍼센트 계산(요구된 4가지 질문)
- 날짜 계산(일수 더하기/빼기, 날짜 차이)
- 단위 변환(길이/면적/무게/부피/온도/압력/속도)
- 환율 계산(Frankfurter API + 캐시)
- 사용자별 기록(로그인 기반, Firestore 저장)

## Firestore 보안 규칙
```
match /users/{uid}/history/{docId} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```
