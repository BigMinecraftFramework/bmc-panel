import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFile, faTrash, faDownload, faPen, faBox, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { isTextFile } from '../../utils/textUtil';

const FilesList = ({
   files,
   loading,
   onNavigate,
   onDelete,
   onDownload,
   onRename,
   onArchive,
   onUnarchive,
   onEdit,
   uploading,
   uploadProgress,
   selectedFiles,
   onSelectFile,
   onSelectAllFiles
}) => {
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (timestamp) => {
        const date = new Date(parseInt(timestamp));
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const actionButtonStyle = {
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.25rem 0'
    };

    const isSelected = (file) => {
        return selectedFiles.some(selected => selected.path === file.path);
    };

    const allFilesSelected = files.length > 0 &&
        files.every(file => isSelected(file));

    const handleFileClick = (file) => {
        if (file.type === 'd') {
            onNavigate(file.path);
        } else if (isTextFile(file.name)) {
            onEdit(file);
        }
    };

    return (
        <div className="card shadow-sm">
            {uploading && (
                <div className="card-header p-0">
                    <div className="progress" style={{ height: '3px', borderRadius: '0' }}>
                        <div
                            className="progress-bar progress-bar-striped progress-bar-animated"
                            role="progressbar"
                            style={{ width: `${uploadProgress}%` }}
                            aria-valuenow={uploadProgress}
                            aria-valuemin="0"
                            aria-valuemax="100"
                        />
                    </div>
                </div>
            )}
            <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                    <tr>
                        <th style={{ width: '40px' }}>
                            <input
                                type="checkbox"
                                className="form-check-input"
                                checked={allFilesSelected}
                                onChange={() => onSelectAllFiles(!allFilesSelected)}
                            />
                        </th>
                        <th style={{ width: '30%' }}>Name</th>
                        <th style={{ width: '15%' }}>Type</th>
                        <th style={{ width: '15%' }}>Size</th>
                        <th style={{ width: '25%' }}>Last Modified</th>
                        <th style={{ width: '15%' }}>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="6" className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </td>
                        </tr>
                    ) : files.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="text-center py-4 text-muted">
                                This directory is empty
                            </td>
                        </tr>
                    ) : (
                        files.map((file) => (
                            <tr
                                key={file.path}
                                className={isSelected(file) ? 'table-active' : ''}
                            >
                                <td>
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={isSelected(file)}
                                        onChange={() => onSelectFile(file)}
                                    />
                                </td>
                                <td>
                                    <button
                                        className={`btn btn-link text-decoration-none p-0 text-start w-100 ${
                                            file.type !== 'd' && !isTextFile(file.name) ? 'pe-none' : ''
                                        }`}
                                        onClick={() => handleFileClick(file)}
                                        title={file.type === 'd' ? 'Open directory' : isTextFile(file.name) ? 'Edit file' : ''}
                                    >
                                        <FontAwesomeIcon
                                            icon={file.type === 'd' ? faFolder : faFile}
                                            className={`me-2 ${file.type === 'd' ? 'text-warning' : 'text-secondary'}`}
                                        />
                                        {file.name}
                                    </button>
                                </td>
                                <td>
                                    <span className={`badge ${file.type === 'd' ? 'bg-warning' : 'bg-secondary'}`}>
                                        {file.type === 'd' ? 'Directory' : 'File'}
                                    </span>
                                </td>
                                <td>
                                    {file.type === 'd' ? '-' : formatFileSize(file.size || 0)}
                                </td>
                                <td>
                                    {formatDate(file.modifyTime)}
                                </td>
                                <td>
                                    <div className="btn-group">
                                        <button
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() => onDownload(file)}
                                            title={`Download ${file.type === 'd' ? 'Directory' : 'File'}`}
                                            style={actionButtonStyle}
                                        >
                                            <FontAwesomeIcon icon={faDownload} fixedWidth />
                                        </button>
                                        <button
                                            className="btn btn-outline-secondary btn-sm ms-2"
                                            onClick={() => onRename(file)}
                                            title={`Rename ${file.type === 'd' ? 'Directory' : 'File'}`}
                                            style={actionButtonStyle}
                                        >
                                            <FontAwesomeIcon icon={faPen} fixedWidth />
                                        </button>
                                        {file.isArchived ? (
                                            <button
                                                className="btn btn-outline-info btn-sm ms-2"
                                                onClick={() => onUnarchive(file)}
                                                title={`Unarchive ${file.type === 'd' ? 'Directory' : 'File'}`}
                                                style={actionButtonStyle}
                                            >
                                                <FontAwesomeIcon icon={faBoxOpen} fixedWidth />
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-outline-secondary btn-sm ms-2"
                                                onClick={() => onArchive(file)}
                                                title={`Archive ${file.type === 'd' ? 'Directory' : 'File'}`}
                                                style={actionButtonStyle}
                                            >
                                                <FontAwesomeIcon icon={faBox} fixedWidth />
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-outline-danger btn-sm ms-2"
                                            onClick={() => onDelete(file)}
                                            title={`Delete ${file.type === 'd' ? 'Directory' : 'File'}`}
                                            style={actionButtonStyle}
                                        >
                                            <FontAwesomeIcon icon={faTrash} fixedWidth />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FilesList;