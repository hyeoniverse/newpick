import styled from 'styled-components';
import SubscribeToggle from '@/components/mypage/profile/SubscribeToggle';

function Profile() {
  return (
    <ProfileStyled>
      <div className="profile">
        <img src="/icons/profile_dummy.jpg" alt="prifile-img" />
        <div className="profile-text">
          <h4>uerId</h4>
          <p>gmail@gmail.com</p>
          <ul>
            <li>#keyword1</li>
            <li>#keyword2</li>
            <li>#keyword3</li>
            <li>#key4</li>
          </ul>
        </div>
      </div>
      <div className="subscribe">
        <SubscribeToggle />
      </div>
    </ProfileStyled>
  );
}

const ProfileStyled = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    .profile {
        display: flex;
        flex-direction: row;
        gap: 2rem;
        align-items: center;
        
        img {
            height: 100px;
            width: 100px;
            border: 1px solid ${({theme}) => theme.color.line};
            border-radius: ${({theme}) => theme.borderRadius.circle};
        }

        .profile-text {
            h4 {
                font-size: ${({theme}) => theme.fontSize.medium};
            }

            p {
                color: ${({theme}) => theme.color.lightGrey};
                padding: 0.25rem 0;
            }

            ul {
                display: flex;
                flex-direction: row;
                gap: 0.875rem;
                color: ${({theme}) => theme.color.subtext};
            }
        }
    }
`;

export default Profile;