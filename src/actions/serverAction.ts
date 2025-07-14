import * as event from "./routes/events";
import * as permission from "./routes/permission";
import * as role from "./routes/role";
import * as user from "./routes/user";
import * as payment from "./routes/payment";

// You could type this too:
export const server = {
	user,
	role,
	permission,
	event,
	payment,
};
