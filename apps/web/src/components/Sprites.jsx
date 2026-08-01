import React from "react";
import "../components/Sprites.css";

const Sprites = ({ list, onSelect, selected }) => {
  const [selectedOption, setSelectedOption] = React.useState(selected);

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
          className={`option-item d-flex justify-center ${
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
