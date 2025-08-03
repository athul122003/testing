// //Maps permission names to server action route names that require them
// const permissionRouteMap: Record<string, string[]> = {
// 	MANAGE_USER_ROLES: [
// 		"role.getAll",
// 		"user.search",
// 		"user.updateOneRole",
// 		"user.updateMultipleRoles",
// 	],
// 	MANAGE_ROLE_PERMISSIONS: [
// 		"role.getAll",
// 		"role.create",
// 		"role.delete",
// 		"role.updateRolePermissions",
// 	],

// 	MANAGE_EVENTS: [],
// 	MANAGE_PAYMENTS: [],
// 	MANAGE_CORE: [],
// 	ISSUE_CERTIFICATE: [],
// } as const;

// export const PermissionKeyEnum = {
//   MANAGE_USER_ROLES: "MANAGE_USER_ROLES",
//   MANAGE_ROLE_PERMISSIONS: "MANAGE_ROLE_PERMISSIONS",
//   MANAGE_EVENTS: "MANAGE_EVENTS",
//   MANAGE_PAYMENTS: "MANAGE_PAYMENTS",
//   MANAGE_CORE: "MANAGE_CORE",
//   ISSUE_CERTIFICATE: "ISSUE_CERTIFICATE",
// } as const;

// // 🔁 Inverted map from route name to permission(s) required
// export const routePermissionMap: Record<string, string[]> = {};

// for (const [permission, routes] of Object.entries(permissionRouteMap)) {
// 	for (const route of routes) {
// 		routePermissionMap[route] ??= [];
// 		routePermissionMap[route].push(permission);
// 	}
// }
export const permissionKeys = {
	MANAGE_USER_ROLES: "MANAGE_USER_ROLES",
	MANAGE_ROLE_PERMISSIONS: "MANAGE_ROLE_PERMISSIONS",
	MANAGE_EVENTS: "MANAGE_EVENTS",
	MANAGE_PAYMENTS: "MANAGE_PAYMENTS",
	MANAGE_CORE: "MANAGE_CORE",
	ISSUE_CERTIFICATE: "ISSUE_CERTIFICATE",
	MANAGE_SETTINGS: "MANAGE_SETTINGS",
} as const;

// ✅ Define corresponding route arrays (in same order)
export const permissionRoutes = [
	// MANAGE_USER_ROLES
	[
		"role.getAll",
		"user.search",
		"user.updateOneRole",
		"user.updateMultipleRoles",
	],

	// MANAGE_ROLE_PERMISSIONS
	["role.getAll", "role.create", "role.delete", "role.updateRolePermissions"],

	// MANAGE_EVENTS
	[
		"event.ALLPERM",
		"user.searchByUsn",
		"event.getAll",
		"event.organiser.getAll",
		"event.organiser.remove",
		"event.organiser.add",
	],

	// MANAGE_PAYMENTS
	["payment.ALLPERM"],

	// MANAGE_CORE
	[],

	// ISSUE_CERTIFICATE
	["certificate.ALLPERM", "event.getAll"],

	// MANAGE_SETTINGS
	["settings.ALLPERM"],
] as const;

// Convert keys object to array for iteration
const permissionKeyList = Object.values(permissionKeys);

// Generate map: route -> [permissions]
export const routePermissionMap: Record<string, string[]> = {};

permissionKeyList.forEach((permission, index) => {
	const routes = permissionRoutes[index];

	for (const route of routes) {
		routePermissionMap[route] ??= [];
		routePermissionMap[route].push(permission);
	}
});
