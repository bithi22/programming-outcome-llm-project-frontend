import React from 'react';

function ClassCard({ name, course, course_code, image,onClick }) {
  return (
    <div className="w-full bg-white shadow-md rounded-lg overflow-hidden">
      {/* Image */}
      <img src={image} alt={name} className="w-full h-40 object-cover" />

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-inter font-semibold tracking-[-0.04em]">{name}</h3>
        <span className="font-inter font-normal tracking-[-0.04em]">
          {course}
        </span>
        <p className="text-sm text-gray-600 mt-2">{course_code}</p>

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
