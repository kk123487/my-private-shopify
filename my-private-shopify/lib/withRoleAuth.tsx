
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useRole } from './useRole';

type UserRole = 'super_admin' | 'store_admin' | 'user';

export function withRoleAuth<P extends object>(
	Component: React.ComponentType<P>,
	requiredRole: UserRole | UserRole[]
) {
	return function RoleProtectedComponent(props: P) {
		const router = useRouter();
		const { userRole, loading } = useRole();

		useEffect(() => {
			if (!loading) {
				const rolesArray = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
				if (!userRole || !rolesArray.includes(userRole)) {
					router.push('/unauthorized');
				}
			}
		}, [loading, userRole, router]);

		if (loading) {
			return (
				<div className="p-5 text-center">
					<p>Loading...</p>
				</div>
			);
		}

		const rolesArray = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

		if (!userRole || !rolesArray.includes(userRole)) {
			return (
				<div className="p-5 text-center">
					<p>Checking permissions...</p>
				</div>
			);
		}

		return <Component {...props} />;
	};
}
