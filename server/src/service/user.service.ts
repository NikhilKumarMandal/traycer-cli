import { db } from "../db/db";



export async function findFirst(token: string) {
    
    return await db.user.findFirst({
        where: {
            sessions: {
                some: {
                    token: token,
                },
            },
        },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
        },
    });
}