'use client';

/**
 * 맨 바깥 레이아웃까지 깨졌을 때. 이때는 테마·헤더가 없으므로 글자와 기본 색만으로 그린다
 */
export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return (
		<html lang="ko">
			<body
				style={{
					margin: 0,
					minHeight: '100vh',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					gap: '0.75rem',
					padding: '1rem',
					textAlign: 'center',
					fontFamily: 'Pretendard, system-ui, sans-serif',
					wordBreak: 'keep-all',
				}}
			>
				<p style={{ margin: 0, fontWeight: 800, color: '#3610e1' }}>NewPick</p>
				<h1 style={{ margin: 0, fontSize: '1.5rem' }}>일시적인 오류가 생겼어요</h1>
				<p style={{ margin: 0, color: '#808080' }}>잠시 뒤 다시 시도해 주세요.</p>
				<button
					type="button"
					onClick={reset}
					style={{
						marginTop: '1.5rem',
						padding: '0.8rem 1.2rem',
						border: 0,
						background: '#3610e1',
						color: '#fff',
						fontSize: '1rem',
						cursor: 'pointer',
					}}
				>
					다시 시도
				</button>
			</body>
		</html>
	);
}
