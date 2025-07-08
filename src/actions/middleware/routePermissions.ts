// 🔐 Maps permission names to server action route names that require them
const permissionRouteMap: Record<string, string[]> = {
	MANAGE_USER_ROLES: [
		"role.getAll",
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
} as const;

// export type PermissionKey = typeof permissionRouteMap[keyof typeof permissionRouteMap];
// export const PermissionKeyEnum = Object.freeze(
// 	Object.keys(permissionRouteMap).reduce((acc, key) => {
// 		acc[key as keyof typeof permissionRouteMap] = key;
// 		return acc;
// 	}, {} as Record<keyof typeof permissionRouteMap, string>)
// );

// 🔁 Inverted map from route name to permission(s) required
export const routePermissionMap: Record<string, string[]> = {};

for (const [permission, routes] of Object.entries(permissionRouteMap)) {
	for (const route of routes) {
		routePermissionMap[route] ??= [];
		routePermissionMap[route].push(permission);
	}
}
