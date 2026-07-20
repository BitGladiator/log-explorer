
const SPINNER_CSS = `
  .fancy-spinner {
    --color-1: #fff;
    --color-2: #289E49;
    --size: 1px;

    animation: fs-rotate 1s infinite;
    height: calc(50 * var(--size));
    width: calc(50 * var(--size));
    display: inline-block;
    flex-shrink: 0;
  }
  .fancy-spinner::before,
  .fancy-spinner::after {
    content: '';
    display: block;
    height: calc(20 * var(--size));
    width: calc(20 * var(--size));
  }
  .fancy-spinner::before {
    animation: fs-box1 1s infinite;
    background-color: var(--color-1);
    box-shadow: calc(30 * var(--size)) 0 0 var(--color-2);
    margin-bottom: calc(10 * var(--size));
  }
  .fancy-spinner::after {
    animation: fs-box2 1s infinite;
    background-color: var(--color-2);
    box-shadow: calc(30 * var(--size)) 0 0 var(--color-1);
  }

  @keyframes fs-rotate {
    0%   { transform: rotate(0deg)   scale(0.8); }
    50%  { transform: rotate(360deg) scale(1.2); }
    100% { transform: rotate(720deg) scale(0.8); }
  }
  @keyframes fs-box1 {
    0%   { box-shadow: calc(30 * var(--size)) 0 0 var(--color-2); }
    50%  {
      box-shadow: 0 0 0 var(--color-2);
      margin-bottom: 0;
      transform: translate(calc(15 * var(--size)), calc(15 * var(--size)));
    }
    100% {
      box-shadow: calc(30 * var(--size)) 0 0 var(--color-2);
      margin-bottom: calc(10 * var(--size));
    }
  }
  @keyframes fs-box2 {
    0%   { box-shadow: calc(30 * var(--size)) 0 0 var(--color-1); }
    50%  {
      box-shadow: 0 0 0 var(--color-1);
      margin-top: calc(-20 * var(--size));
      transform: translate(calc(15 * var(--size)), calc(15 * var(--size)));
    }
    100% {
      box-shadow: calc(30 * var(--size)) 0 0 var(--color-1);
      margin-top: 0;
    }
  }
`;

/**
 * @param {{ size?: number, color1?: string, color2?: string, inline?: boolean }} props
 */
const Spinner = ({ size = 50, color1 = '#fff', color2 = '#289E49', inline = false }) => {
  const style = {
    '--size': `${size / 50}px`,
    '--color-1': color1,
    '--color-2': color2,
  };

  return (
    <>
      <style>{SPINNER_CSS}</style>
      <span className="fancy-spinner" style={style} />
    </>
  );
};

export default Spinner;
