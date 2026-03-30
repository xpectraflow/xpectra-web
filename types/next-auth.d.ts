import { DefaultSession } from "next-auth";

type ProjectMembership = {
  id: string;
};

type OrganizationMembership = {
  projects: ProjectMembership[];
};

declare module "next-auth" {
  interface User {
    id: string;
    admin?: boolean;
    organizations?: OrganizationMembership[];
  }

  interface Session {
    user: {
      id: string;
      admin?: boolean;
      organizations?: OrganizationMembership[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    admin?: boolean;
    organizations?: OrganizationMembership[];
  }
}
