import React from 'react';
import './ParticipantList.css';

const ParticipantList = ({ participants, onParticipantClick }) => {
    const handleImageLoad = (e) => {
        e.target.classList.add('loaded');
    };

    const handleImageError = (e) => {
        e.target.classList.add('loaded');
    };

    return (
        <div className="participant-list">
            {participants.map((participant) => (
                <div
                    key={participant.id}
                    className="participant-item"
                    onClick={() => onParticipantClick(participant)}
                >
                    <div className="participant-avatar">
                        <div className="shimmer"></div>
                        <img
                            src={participant.image}
                            alt={participant.name}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                        />
                    </div>
                    <div className="participant-info">
                        <h3>{participant.name}</h3>
                        <p>{participant.role}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ParticipantList;
