// 🔐 Maps permission names to server action route names that require them
const permissionRouteMap: Record<string, string[]> = {
	MANAGE_USER_ROLES: [
		"user.search",
		"user.updateOneRole",
		"user.updateMultipleRoles",
	],
	MANAGE_ROLE_PERMISSIONS: [
		"role.getAll",
		"role.create",
		"role.delete",
		"role.updateRolePermissions",
	],

	MANAGE_EVENTS: [],
	MANAGE_PAYMENTS: [],
	MANAGE_TEAMS: [],
	ISSUE_CERTIFICATE: [],
};

// 🔁 Inverted map from route name to permission(s) required
export const routePermissionMap: Record<string, string[]> = {};

for (const [permission, routes] of Object.entries(permissionRouteMap)) {
	for (const route of routes) {
		routePermissionMap[route] ??= [];
		routePermissionMap[route].push(permission);
	}
}
