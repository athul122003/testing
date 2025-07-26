"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import React, { type FunctionComponent } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "~/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";

import { cn } from "~/lib/utils";
import { loginZ } from "~/zod/authZ";

const Login: NextPage = () => {
	return (
		<div className="flex min-h-screen gap-10 bg-gradient-to-bl from-[#1e1333] via-[#0a001c] to-[#0e0a2a] ">
			<div className="my-10 flex w-full justify-center flex-col items-center gap-8 sm:my-20 sm:gap-16 lg:mx-24 lg:flex-row">
				<div className="order-1 mx-8 w-4/5 flex-col justify-center rounded-lg backdrop-blur-lg sm:w-2/3 lg:order-2 lg:w-1/3">
					<div className="m-0 sm:m-4">
						<LoginForm />
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;

interface Props {
	className?: string;
}

const LoginForm: FunctionComponent<Props> = ({ className }) => {
	const router = useRouter();
	const { data: session, status } = useSession();

	React.useEffect(() => {
		if (status === "authenticated" && session) {
			router.push("/");
		}
	}, [session, status, router]);

	const formSchema = loginZ;

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		const toastId = toast.loading("Logging in...");

		try {
			const result = await signIn("credentials", {
				email: values.email,
				password: values.password,
				redirect: false,
			});

			toast.dismiss(toastId);

			if (result?.ok) {
				toast.success("Logged in successfully");
				//router.push(`/`);
				window.location.href = "/";
			} else {
				toast.error(
					result?.error === "CredentialsSignin"
						? "Invalid email or password. Please try again."
						: result?.error ||
								"Failed to log in! Please check your credentials.",
				);
			}
		} catch (e) {
			toast.dismiss(toastId);
			console.error("Login process error:", e);
			toast.error("An unexpected error occurred. Please try again.");
		}
	};

	if (status === "loading") {
		return (
			<div className="min-h-screen bg-gradient-to-bl from-[#1e1333] via-[#0a001c] to-[#0e0a2a] flex items-center justify-center">
				<div className="flex items-center text-white text-lg">
					<div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
					Loading session...
				</div>
			</div>
		);
	}

	if (status === "authenticated") {
		return null;
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className={cn(className, "space-y-8 ")}
			>
				<FormMessage className="flex justify-center text-4xl font-bold text-white">
					Login
				</FormMessage>
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-white dark:text-white">
								Email
							</FormLabel>
							<FormControl>
								<Input
									className="bg-[#555555]"
									placeholder="Email"
									{...field}
									disabled={form.formState.isSubmitting}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-white dark:text-white">
								Password
							</FormLabel>
							<FormControl>
								<Input
									type="password"
									className="bg-[#555555]"
									placeholder="Password"
									{...field}
									disabled={form.formState.isSubmitting}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className="!mt-2 flex justify-between text-sm">
					<Link
						href={`${process.env.NEXT_PUBLIC_FRONTEND_URL}/auth/forgot`}
						className="text-muted-foreground text-white underline dark:text-white "
					>
						Forgot password
					</Link>
				</div>
				<div className="flex  flex-col justify-center gap-2">
					<Button
						className="bg-[#66209b] font-bold text-white hover:bg-purple-900"
						type="submit"
						disabled={form.formState.isSubmitting}
					>
						{form.formState.isSubmitting ? "Logging In..." : "Submit"}
					</Button>
					<p className="mb-4  mt-4 text-center text-base text-white dark:text-white">
						Don&#39;t have an account?&nbsp;
						<strong className="underline">
							<Link
								href={`${process.env.NEXT_PUBLIC_FRONTEND_URL}/auth/signup`}
							>
								Signup{" "}
							</Link>
						</strong>
					</p>
				</div>
			</form>
		</Form>
	);
};
