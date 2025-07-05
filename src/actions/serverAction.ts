import * as permission from "./routes/permission";
import * as role from "./routes/role";
import * as user from "./routes/user";
import * as event from "./routes/events";

// You could type this too:
export const server = {
	user,
	role,
	permission,
	event,
};
