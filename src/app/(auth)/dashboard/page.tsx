import { auth } from "@/lib/auth";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Logout from "@/app/components/logOut";

export default async function Dashboard() {
    
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        
        redirect("/");
    }




    const name = session?.user?.name;
    return (
        <div className="mt-52">
            <h1>Dashboard</h1>
            <h2>Welcome, {name}</h2>
            <Logout />
        </div>
    );
}
