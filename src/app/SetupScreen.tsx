export default function SetupScreen() {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-header">
          <h1>환경 설정이 필요합니다</h1>
          <p>Firebase 설정을 넣으면 바로 로그인 화면이 뜹니다.</p>
        </div>
        <ol className="setup-list">
          <li>.env.example을 복사해서 .env 파일 만들기</li>
          <li>Firebase 웹 앱 설정값을 .env에 입력</li>
          <li>터미널에서 다시 실행: npm run dev</li>
        </ol>
      </div>
    </div>
  )
}
