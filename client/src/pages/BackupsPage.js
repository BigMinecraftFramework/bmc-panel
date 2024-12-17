import React, { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import DeploymentTab from "../components/backups/deployments/DeploymentTab";
import DatabaseTab from "../components/backups/databases/DatabaseTab";
export const BACKUP_TABS = [
    {
        id: 'deployments',
        label: 'Deployments',
        component: DeploymentTab
    },
    {
        id: 'databases',
        label: 'Databases',
        component: DatabaseTab
    }
]

const BackupsPage = () => {
    const [activeTab, setActiveTab] = useState(BACKUP_TABS[0].id)
    const ActiveComponent = BACKUP_TABS.find(tab => tab.id === activeTab)?.component || BACKUP_TABS[0].component

    return (
        <div className="container py-4">
            <ul className="nav nav-tabs mb-4">
                {BACKUP_TABS.map(tab => (
                    <li key={tab.id} className="nav-item">
                        <button
                            className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    </li>
                ))}
            </ul>
            <ActiveComponent />
        </div>
    )
}

export default BackupsPage