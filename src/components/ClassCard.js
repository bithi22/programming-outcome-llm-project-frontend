import React from 'react';

function ClassCard({ title, year, semester, image,onClick }) {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Image */}
      <img src={image} alt={title} className="w-full h-40 object-cover" />

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-sm bg-blue-100 text-blue-500 px-2 py-1 rounded-full">
          {year}
        </span>
        <p className="text-sm text-gray-600 mt-2">{semester}</p>

        {/* Button */}
        <button 
        onClick={onClick}
        className="bg-[#3941ff] text-white py-2 px-4 rounded-md font-inter font-semibold text-[16px] tracking-[-0.04em] text-center hover:bg-[#2C36CC]">
          View Class
        </button>
      </div>
    </div>
  );
}

export default ClassCard;
