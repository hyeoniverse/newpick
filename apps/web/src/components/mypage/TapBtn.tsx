import styled from 'styled-components';

interface TabProps {
  activeTab: string;
  setActiveTab: (activeTab: string) => void;
}

function TapBtn({ activeTab, setActiveTab }: TabProps) {
  return (
    <TapBtnStyled>
      <button
        onClick={() => setActiveTab('subscribe')}
        className={activeTab === 'subscribe' ? 'active' : ''}
      >
        구독한 뉴스레터
      </button>
      <button
        onClick={() => setActiveTab('subscribe')}
        className={activeTab === 'subscribe' ? 'active' : ''}
      >
        북마크한 뉴스레터
      </button>
      <button
        onClick={() => setActiveTab('subscribe')}
        className={activeTab === 'subscribe' ? 'active' : ''}
      >
        뉴스레터 설정
      </button>
    </TapBtnStyled>
  );
}

const TapBtnStyled = styled.div`

`;

export default TapBtn;