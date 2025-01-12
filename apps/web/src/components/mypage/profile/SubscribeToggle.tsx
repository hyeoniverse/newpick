import styled from "styled-components";
import { useState } from "react";
import { ToggleIcon } from "@/components/common/svg/ToggleSVG";
import { useModal } from "@/hooks/useModal";
import { useRouter } from "next/navigation"

function SubscribeToggle() {
  const {isOpen, modalType, openModal, closeModal} = useModal();
  const [ toggle, setToggle ] = useState(false)
  const router = useRouter();

  const toggleSubscribe = () => {
    setToggle(!toggle);
  }

  const handleConfirm = () => {
    closeModal();
    router.push("/mypage")
  }

  return (
    <SubscribeToggleStyled>
      {/*구독 진행 중에 따라 노출 변경 필요*/}
      <div className={toggle ? "subscribe-on" : "subscribe-off"} onClick={toggleSubscribe}>
        <ToggleIcon className="svg" $toggle={toggle} />
        <p>{toggle ? "구독 진행중" : "구독 일시정지 중"}</p>
      </div>

      {/* 구독 상태가 아닐 경우 노출 필요*/}
      {/*<div className="not-subscribe" onClick={() => openModal('not-subscribe')}>*/}
      {/*  <LuBellOff />*/}
      {/*  <p>구독 상태가 아닙니다.</p>*/}
      {/*</div>*/}
      {/*/!*모달*!/*/}
      {/*{isOpen && modalType === 'not-subscribe' && (*/}
      {/*  <Modal isOpen={isOpen} onClose={closeModal}>*/}
      {/*    <ModalContents*/}
      {/*      icon={<LuBell />}*/}
      {/*      title="구독 상태가 아닙니다."*/}
      {/*      content={`새롭게 뉴스레터를 구독해보시겠습니까? 확인을 누르시면 구독페이지로 넘어갑니다.`}*/}
      {/*      outlineButton="취소"*/}
      {/*      filledButton="확인"*/}
      {/*      onCancelClick={closeModal}*/}
      {/*      onConfirmClick={handleConfirm}*/}
      {/*    />*/}
      {/*  </Modal>*/}
      {/*)}*/}
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

        &:hover {
            color: ${({theme}) => theme.color.primary};
            border: 1px solid ${({theme}) => theme.color.primary};
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
            border-color: ${({theme}) => theme.color.primary};
            color: ${({theme}) => theme.color.primary};
            background-color: ${({theme}) => theme.color.colorBackground};
        }
    }
`;


export default SubscribeToggle;