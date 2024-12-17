import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../../utils/auth";
import DeploymentsList from './DeploymentsList';
import CreateBackupModal from './CreateBackupModal';
import ViewBackupsModal from './ViewBackupsModal';

const DeploymentTab = () => {
    const navigate = useNavigate();
    const [deployments, setDeployments] = useState([]);
    const [proxy, setProxy] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateBackupModal, setShowCreateBackupModal] = useState(false);
    const [showViewBackupsModal, setShowViewBackupsModal] = useState(false);
    const [selectedDeployment, setSelectedDeployment] = useState(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (notifications.length > 0) {
            const timer = setTimeout(() => {
                setNotifications(prev => prev.slice(1));
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notifications]);

    const addNotification = (message, type) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
    };

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [deploymentsResponse, proxyResponse] = await Promise.all([
                axiosInstance.get('/api/deployments'),
                axiosInstance.get('/api/proxy-config')
            ]);

            setDeployments(deploymentsResponse.data);

            // Add name to proxy data before setting
            const proxyData = proxyResponse.data;
            proxyData.name = "Velocity Proxy";
            setProxy(proxyData);

            setError(null);
        } catch (err) {
            setError('Failed to load data');
            console.error('Error fetching data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateBackup = async (deploymentId, backupDetails) => {
        try {
            await axiosInstance.post(`/api/deployments/${deploymentId}/backups`, backupDetails);
            setShowCreateBackupModal(false);
            setSelectedDeployment(null);
            addNotification('Successfully created backup', 'success');
        } catch (err) {
            console.error('Error creating backup:', err);
            addNotification('Failed to create backup', 'danger');
        }
    };

    const handleViewData = (dataDirectory) => {
        navigate(`/files${dataDirectory}`);
    };

    if (isLoading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 1050 }}>
                {notifications.map(({ id, message, type }) => (
                    <div key={id} className={`alert alert-${type} alert-dismissible fade show`} role="alert">
                        {message}
                        <button type="button" className="btn-close" onClick={() => setNotifications(prev => prev.filter(n => n.id !== id))} />
                    </div>
                ))}
            </div>

            <div className="row g-4">
                {deployments.length === 0 ? (
                    <div className="col-12">
                        <div className="card shadow-sm border">
                            <div className="card-body text-center py-5">
                                <h5 className="card-title mb-0 text-muted">No Deployments Found</h5>
                            </div>
                        </div>
                    </div>
                ) : (
                    <DeploymentsList
                        deployments={deployments}
                        proxyInfo={proxy}
                        onCreateBackup={(deployment) => {
                            setSelectedDeployment(deployment);
                            setShowCreateBackupModal(true);
                        }}
                        onViewBackups={(deployment) => {
                            setSelectedDeployment(deployment);
                            setShowViewBackupsModal(true);
                        }}
                        onViewData={handleViewData}

                    />
                )}
            </div>

            {showCreateBackupModal && selectedDeployment && (
                <CreateBackupModal
                    deployment={selectedDeployment}
                    onClose={() => {
                        setShowCreateBackupModal(false);
                        setSelectedDeployment(null);
                    }}
                    onCreateBackup={handleCreateBackup}
                />
            )}

            {showViewBackupsModal && selectedDeployment && (
                <ViewBackupsModal
                    deployment={selectedDeployment}
                    onClose={() => {
                        setShowViewBackupsModal(false);
                        setSelectedDeployment(null);
                    }}
                />
            )}
        </div>
    );
};

export default DeploymentTab;