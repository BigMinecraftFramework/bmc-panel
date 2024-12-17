import React from 'react';
import { Plus, Clock } from 'lucide-react';

const DeploymentsList = ({
    deployments,
    proxyInfo,
    onCreateBackup,
    onViewBackups,
    onViewData
}) => {
    const persistentDeployments = deployments.filter(d => d.type === 'persistent');
    const nonPersistentDeployments = deployments.filter(d => d.type === 'non-persistent');

    const DeploymentCard = ({ deployment }) => (
        <div className="card shadow-sm border mb-3">
            <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                    <h5 className="card-title mb-1">{deployment.name}</h5>
                    <p className="card-text text-muted small mb-0">{deployment.path}</p>
                </div>

                <div className="d-flex align-items-center gap-3">
                    <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => onCreateBackup(deployment)}
                        title="Create Backup"
                    >
                        <Plus className="w-4 h-4" />
                    </button>

                    <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => onViewBackups(deployment)}
                        title="View Backups"
                    >
                        <Clock className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    const EmptyCard = ({ message }) => (
        <div className="card shadow-sm border">
            <div className="card-body text-center py-5">
                <h5 className="card-title mb-0 text-muted">{message}</h5>
            </div>
        </div>
    );

    return (
        <div className="col-12">
            {/* Proxy Section */}
            <div className="mb-4">
                <h5 className="mb-3">Proxy</h5>
                {proxyInfo ? (
                    <DeploymentCard deployment={proxyInfo} />
                ) : (
                    <EmptyCard message="No Proxy Found" />
                )}
            </div>

            {/* Persistent Deployments Section */}
            <div className="mb-4">
                <h5 className="mb-3">Persistent Deployments</h5>
                {persistentDeployments.length > 0 ? (
                    persistentDeployments.map(deployment => (
                        <DeploymentCard
                            key={deployment.name}
                            deployment={deployment}
                        />
                    ))
                ) : (
                    <EmptyCard message="No Persistent Deployments Found" />
                )}
            </div>

            {/* Non-Persistent Deployments Section */}
            <div className="mb-4">
                <h5 className="mb-3">Non-Persistent Deployments</h5>
                {nonPersistentDeployments.length > 0 ? (
                    nonPersistentDeployments.map(deployment => (
                        <DeploymentCard
                            key={deployment.name}
                            deployment={deployment}
                        />
                    ))
                ) : (
                    <EmptyCard message="No Non-Persistent Deployments Found" />
                )}
            </div>
        </div>
    );
};

export default DeploymentsList;