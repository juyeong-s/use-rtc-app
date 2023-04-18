interface Props {
  onClick: () => void;
}

function Button({ onClick }: Props) {
  return <button onClick={onClick}>카메라 켜기</button>;
}

export default Button;
