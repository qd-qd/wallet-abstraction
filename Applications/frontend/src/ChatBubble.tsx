import { Ref, memo, useImperativeHandle, forwardRef, useState } from 'react';
import { animated, useSpring, easings, useChain, useSpringRef } from '@react-spring/web';
import statueImg from './assets/statue.png';

export type ChatBubbleHandle = {
  show(): void;
  hide(): void;
};

type Props = {
  transactionHash?: string;
};

const ChatBubble = ({ transactionHash }: Props, ref: Ref<ChatBubbleHandle>) => {
  const [visible, setVisible] = useState(false);

  const avatarRef = useSpringRef();
  const [avatarStyle] = useSpring(
    () => ({
      ref: avatarRef,
      from: { opacity: 0, scale: 0, rotate: -200 },
      to: {
        opacity: visible ? 1 : 0,
        scale: visible ? 1 : 0,
        rotate: visible ? 0 : -200,
      },
      config: {
        tension: 180,
        friction: 12,
        easing: easings.easeInElastic,
      },
    }),
    [visible],
  );

  const textRef = useSpringRef();
  const [textStyle] = useSpring(
    () => ({
      ref: textRef,
      from: { opacity: 0, rotate: -20, transformOrigin: 'bottom right', y: 18, x: 10 },
      to: {
        opacity: visible ? 1 : 0,
        rotate: visible ? 0.01 : -20,
      },
      config: {
        tension: visible ? 180 : 170,
        friction: visible ? 12 : 26,
        easing: visible ? easings.easeInElastic : easings.linear,
      },
    }),
    [visible],
  );

  useChain([avatarRef, textRef], [0, 0.4]);

  useImperativeHandle(ref, () => ({
    show: () => {
      setVisible(true);
    },

    hide: () => {
      setVisible(false);
    },
  }));

  return (
    <div className="fixed z-50" style={{ bottom: 30, right: 30 }}>
      <div className="chat chat-end">
        <animated.div className="chat-image avatar pointer-events-none" style={avatarStyle}>
          <div className="w-20 rounded-full">
            <img src={statueImg} alt="The statue of liberty" />
          </div>
        </animated.div>
        <animated.span style={textStyle}>
          <div className="chat-bubble pointer-events-none bg-pink-500">Just minted!</div>
          <div className="chat-footer opacity-50">
            See it{' '}
            <a
              className="link"
              href={`https://sepolia.etherscan.io/tx/0xbd5591edc33a942ce9a3164bf6a3148c2bd04d12b3e9633c1c1af3e984e31454`}
              // href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
              target="_blank"
              rel="noreferrer"
            >
              here
            </a>
          </div>
        </animated.span>
      </div>
    </div>
  );
};

export default memo(forwardRef(ChatBubble));
