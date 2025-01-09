import styled from 'styled-components';
import { useState } from 'react';
import { LuBellOff } from "react-icons/lu";
import { ToggleIcon } from '@/components/common/svg/ToggleSVG';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/common/Modal';

function SubscribeToggle() {
  const {isOpen, modalType, openModal, closeModal} = useModal();
  const [ toggle, setToggle ] = useState(false)

  const toggleSubscribe = () => {
    setToggle(!toggle);
  }

  return (
    <SubscribeToggleStyled>
      <div className={toggle ? 'subscribe-on' : 'subscribe-off'} onClick={toggleSubscribe}>
            <ToggleIcon className='svg' toggle={toggle}/>
            <p>{toggle ? '구독 진행중' : '구독 일시정지 중'}</p>
      </div>

      <div className="not-subscribe" onClick={() => openModal('subscribe')}>
        <LuBellOff />
        <p>구독 상태가 아닙니다.</p>
      </div>
      {isOpen && modalType === 'subscribe' && (
        <Modal isOpen={isOpen} onClose={closeModal}>
          <div>구독하기 모달 내용</div>
        </Modal>
      )}
    </SubscribeToggleStyled>
  );
}

const SubscribeToggleStyled = styled.div`
    .subscribe-on, .subscribe-off, .not-subscribe {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.725rem;
        padding: 1.25rem;
        border-radius: ${({theme}) => theme.borderRadius.medium};
        height: 3.875rem;
        width: 14rem;
        font-weight: ${({theme}) => theme.fontWeight.medium};
        cursor: pointer;
        transition: background-color 0.5s, border-color 0.5s, color 0.5s;

        &:hover {
            opacity: 0.9;
            transition: background-color 0.5s, border-color 0.5s, color 0.5s;
        }

        .svg {
            height: 2rem;
            width: 3.25rem;
        }
    }

    .subscribe-on {
        border: 1px solid ${({theme}) => theme.color.primary};
        color: ${({theme}) => theme.color.primary};
        background-color: ${({theme}) => theme.color.colorBackground};
    }

    .subscribe-off {
        border: 1px solid ${({theme}) => theme.color.line};
        color: ${({theme}) => theme.color.text};
        background-color: ${({theme}) => theme.color.surface};
    }

    .not-subscribe {
        border: 1px solid ${({theme}) => theme.color.line};
        color: ${({theme}) => theme.color.text};
        background-color: ${({theme}) => theme.color.surface};
        
        svg {
            width: 1.25rem;
            height: 1.25rem;
            color: ${({theme}) => theme.color.primary};
        }
        
        &:hover {
            border-color: ${({ theme }) => theme.color.primary};
            color: ${({ theme }) => theme.color.primary};
            background-color: ${({theme}) => theme.color.colorBackground};
        }
    }

`;

export default SubscribeToggle;