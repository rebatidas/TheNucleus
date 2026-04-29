import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

type ObjectPermission = {
  object_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

type FieldPermission = {
  object_name: string;
  field_name: string;
  visible: boolean;
  read_only: boolean;
};

type PermissionResponse = {
  profile_id?: number | null;
  object_permissions: ObjectPermission[];
  field_permissions: FieldPermission[];
};

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionResponse>({
    profile_id: null,
    object_permissions: [],
    field_permissions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await api.get("/api/auth/me-permissions");
        setPermissions(
          response.data?.data ?? {
            profile_id: null,
            object_permissions: [],
            field_permissions: [],
          }
        );
      } catch {
        setPermissions({
          profile_id: null,
          object_permissions: [],
          field_permissions: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const objectMap = useMemo(() => {
    const map = new Map<string, ObjectPermission>();
    permissions.object_permissions.forEach((item) => {
      map.set(item.object_name, item);
    });
    return map;
  }, [permissions.object_permissions]);

  const fieldMap = useMemo(() => {
    const map = new Map<string, FieldPermission>();
    permissions.field_permissions.forEach((item) => {
      map.set(`${item.object_name}.${item.field_name}`, item);
    });
    return map;
  }, [permissions.field_permissions]);

  const hasProfile = permissions.profile_id !== null && permissions.profile_id !== undefined;

  const canViewObject = (objectName: string) => {
    if (loading) return true;
    if (!hasProfile) return true;
    return objectMap.get(objectName)?.can_view ?? false;
  };

  const canCreateObject = (objectName: string) => {
    if (loading) return true;
    if (!hasProfile) return true;
    return objectMap.get(objectName)?.can_create ?? false;
  };

  const canEditObject = (objectName: string) => {
    if (loading) return true;
    if (!hasProfile) return true;
    return objectMap.get(objectName)?.can_edit ?? false;
  };

  const canDeleteObject = (objectName: string) => {
    if (loading) return true;
    if (!hasProfile) return true;
    return objectMap.get(objectName)?.can_delete ?? false;
  };

  const isFieldVisible = (objectName: string, fieldName: string) => {
    if (loading) return true;
    if (!hasProfile) return true;
    return fieldMap.get(`${objectName}.${fieldName}`)?.visible ?? true;
  };

  const isFieldReadOnly = (objectName: string, fieldName: string) => {
    if (loading) return false;
    if (!hasProfile) return false;
    return fieldMap.get(`${objectName}.${fieldName}`)?.read_only ?? false;
  };

  return {
    permissions,
    loading,
    hasProfile,
    canViewObject,
    canCreateObject,
    canEditObject,
    canDeleteObject,
    isFieldVisible,
    isFieldReadOnly,
  };
}