import React from 'react';

function Card() {
  return (
    <div
      className="shadow-sm"
      style={{
        width: '450px', // Reduced width for a smaller card
        borderRadius: '12px', // Slightly rounded corners
        border: '1px solid black', // Black border for the card
        padding: '30px', // Reduced padding for a smaller appearance
        backgroundColor: 'white', // Ensure a white background
      }}
    >
      <div>
        <h5
          className="fw-bold mb-2"
          style={{
            fontSize: '1.6rem', // Adjusted font size for the title
            color: 'black',
            textAlign: 'left', // Left-aligned title
          }}
        >
          Join Classs
        </h5>
        <p
          className="mb-3"
          style={{
            fontSize: '1.2rem', // Slightly reduced font size for the subtitle
            color: 'black',
            textAlign: 'left', // Left-aligned subtitle
          }}
        >
          Please select class to request to join them.
        </p>
      </div>
      <div>
        <label
          htmlFor="classSelect"
          className="d-block mb-3"
          style={{
            fontSize: '1.1rem', // Slightly smaller font size for the label
            color: 'black',
            textAlign: 'left', // Left-aligned label
          }}
        >
          Class
        </label>
        <select
          id="classSelect"
          className="form-select mb-4"
          style={{
            borderRadius: '6px', // Slightly rounded
            border: '1px solid black', // Black border for the dropdown
            padding: '10px', // Adjusted padding for usability
            fontSize: '1rem', // Match font size with the rest of the card
            textAlign: 'left', // Left-aligned text inside the dropdown
          }}
        >
          <option></option>
        </select>
      </div>
      <button
        className="btn w-100"
        style={{
          backgroundColor: '#0056ff',
          color: 'white',
          padding: '10px', // Adjusted padding for the smaller button
          borderRadius: '6px', // Match border radius with the select box
          fontSize: '1rem', // Slightly smaller text for the button
          border: 'none',
        }}
      >
        Request to Join
      </button>
    </div>
  );
}

export default Card;
