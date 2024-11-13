import React from "react";
import "../components/Sprites.css";

const Sprites = ({ list, onSelect }) => {
  const [selectedOption, setSelectedOption] = React.useState(null);

  const handleClick = (option) => {
    setSelectedOption(option);
    onSelect(option);
  };

  return (
    <div className="option-carousel Sprites">
      {list.map((option, index) => (
        <label
          key={index}
          onClick={() => handleClick(option)}
          className={`option-item ${
            selectedOption === option ? "selected" : ""
          }`}
        >
          {option}
        </label>
      ))}
    </div>
  );
};

export default Sprites;
