


interface lProps {
  
  color?: string;
  
}
const line: React.FC<lProps> = ({ color = ""}) => {
  return (
    <div className={`${color ? color : 'bg-custom-dark-blue'} w-full h-3 mt-33`}></div>
  );
}
export default line;