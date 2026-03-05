import React from 'react';

const AddNewSupplyButton = ({ onClick }) => {
  return (
    <button onClick={onClick} className="add-new-supply-button">
      Add New Supply
    </button>
  );
};

export default AddNewSupplyButton;
