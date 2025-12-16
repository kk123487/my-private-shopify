import StoreLayout from '../StoreLayout';
import styles from './analytics.module.css';

export default function AnalyticsPage() {
	// Placeholder: Replace with real analytics data fetching
	const stats = [
		{ label: 'Total Sales', value: 'R 12,500.00' },
		{ label: 'Orders', value: '120' },
		{ label: 'Visitors', value: '2,340' },
		{ label: 'Conversion Rate', value: '5.1%' },
		{ label: 'Top Product', value: 'Wireless Headphones' },
	];
	return (
		<StoreLayout>
			<div className={styles.analyticsContainer}>
				<h1>Store Analytics</h1>
				<div className={styles.statsGrid}>
					{stats.map(stat => (
						<div key={stat.label} className={styles.statCard}>
							<div className={styles.statValue}>{stat.value}</div>
							<div className={styles.statLabel}>{stat.label}</div>
						</div>
					))}
				</div>
				<p className={styles.analyticsNote}>
					(This is a sample dashboard. Integrate with real data for live analytics.)
				</p>
			</div>
		</StoreLayout>
	);
}
