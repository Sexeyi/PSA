import React from 'react';

const AddNewSupplyButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center gap-2"
    >
      Add New Supply
    </button>
  );
};

export default AddNewSupplyButton;