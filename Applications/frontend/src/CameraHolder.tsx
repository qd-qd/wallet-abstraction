import { Ref, forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import WebCam from 'react-webcam';
import { animated, useSpring } from '@react-spring/web';
import shutterSoundM4a from './assets/shutter.m4a';
import polaroidImg from './assets/polaroid.png';
import noSig from './assets/nosignal.gif';

const delay = (timing: number) => new Promise((resolve) => setTimeout(resolve, timing));

type Props = {
  cameraRequested: boolean;
  onReady?: () => void;
};

export type CameraHandle = {
  takeScreenshot(): Promise<{ blob: Blob | null; dataURL: string | undefined }>;
  reset(): Promise<void>;
  reveal(): Promise<void>;
};

const CameraHolder = ({ cameraRequested, onReady }: Props, ref: Ref<CameraHandle>) => {
  const polaroidImgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const webcamRef = useRef<WebCam | null>(null);
  const shutterAudio = useRef<HTMLAudioElement | null>(null);

  const [dimensions, setDimensions] = useState<{ height: number; width: number }>();
  useEffect(() => {
    (async () => {
      await new Promise((resolve) => polaroidImgRef.current?.addEventListener('load', resolve));
      const { height, width } = polaroidImgRef.current!.getBoundingClientRect();
      setDimensions({ height: Math.floor(height), width: Math.floor(width) });
    })();
  });

  const [webcamReady, setWebcamReady] = useState(false);

  const defaultCanvasDrawing = useCallback(
    (clear = true) => {
      if (!dimensions) return;

      return (async () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) throw new Error('canvas not rendered');
        if (clear) ctx.clearRect(0, 0, canvasRef.current?.width || 0, canvasRef.current?.height || 0);

        const polaroid = new Image();
        polaroid.src = polaroidImg;
        await new Promise((resolve) => polaroid.addEventListener('load', resolve, { once: true }));
        ctx.drawImage(polaroid, 0, 0, dimensions.width, dimensions.height);
      })();
    },
    [dimensions],
  );

  useEffect(() => {
    defaultCanvasDrawing();
  }, [defaultCanvasDrawing]);

  const [transitions, shutterAnimation] = useSpring(
    () => ({
      from: { opacity: 0 },
    }),
    [],
  );

  useImperativeHandle(ref, () => ({
    async takeScreenshot() {
      const screenshotContent = webcamRef.current!.getScreenshot();
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx || !dimensions || !screenshotContent) throw new Error('missing data');

      const screenshot = new Image();
      screenshot.src = screenshotContent;
      await new Promise((resolve) => screenshot.addEventListener('load', resolve, { once: true }));
      ctx.drawImage(screenshot, 0, 0, dimensions.width, dimensions?.width);

      await defaultCanvasDrawing(false);

      shutterAudio.current?.play();
      shutterAnimation.set({ opacity: 1 });

      const blob = await new Promise<Blob | null>((resolve) => canvasRef.current?.toBlob((b) => resolve(b)));
      const dataURL = canvasRef.current?.toDataURL();

      return {
        blob,
        dataURL,
      };
    },

    async reset() {
      await defaultCanvasDrawing();
    },

    reveal() {
      return new Promise((resolve) => {
        shutterAnimation.start({
          to: { opacity: 0 },
          delay: 1000,
          config: {
            duration: 4000,
            tension: 180,
            friction: 12,
          },
          onRest: () => resolve(),
        });
      });
    },
  }));

  return (
    <>
      <div className="flex relative justify-center align-middle w-full">
        <img className="z-30 w-full absolute top-0 left-0" ref={polaroidImgRef} src={polaroidImg} alt="" />
        <canvas className="z-10 relative" ref={canvasRef} height={dimensions?.height} width={dimensions?.width} />
        <animated.div
          className="absolute w-full h-full z-20 bg-white"
          style={{ mixBlendMode: 'difference', ...transitions }}
        />
        <animated.div className="absolute w-full h-full z-20 bg-white" style={transitions} />
        {!webcamReady && (
          <div className="z-20 h-full w-full top-0 left-0 flex justify-center align-middle overflow-hidden absolute">
            <img src={noSig} alt="no signal" />
          </div>
        )}

        {cameraRequested && (
          <WebCam
            className="absolute top-0 left-0 z-0"
            ref={webcamRef}
            audio={false}
            onUserMedia={async () => {
              const getScreenshot = async (): Promise<string> => {
                const screenshot = webcamRef.current?.getScreenshot();

                if (!screenshot) {
                  await delay(100);
                  return getScreenshot();
                }
                return screenshot;
              };
              await getScreenshot();
              onReady?.();
              setWebcamReady(true);
            }}
            screenshotFormat="image/jpeg"
            mirrored={true}
            videoConstraints={{
              facingMode: 'user',
              width: dimensions?.width,
              height: dimensions?.width,
            }}
          />
        )}
      </div>
      <audio ref={shutterAudio} src={shutterSoundM4a} />
    </>
  );
};

export default memo(forwardRef(CameraHolder));
