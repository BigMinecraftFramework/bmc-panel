import React, { useState } from 'react';

const CreateBackupModal = ({ deployment, onClose, onCreateBackup }) => {
    const [backupName, setBackupName] = useState('');
    const [backupDescription, setBackupDescription] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        await onCreateBackup(deployment.id, {
            name: backupName,
            description: backupDescription
        });
    };

    return (
        <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Create Backup for {deployment.name}</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label htmlFor="backupName" className="form-label">Backup Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="backupName"
                                    value={backupName}
                                    onChange={(e) => setBackupName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="backupDescription" className="form-label">Description (Optional)</label>
                                <textarea
                                    className="form-control"
                                    id="backupDescription"
                                    value={backupDescription}
                                    onChange={(e) => setBackupDescription(e.target.value)}
                                    rows={3}
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Create Backup</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateBackupModal;