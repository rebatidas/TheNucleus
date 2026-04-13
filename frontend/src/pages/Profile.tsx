import React from "react";
import { Card } from "antd";
import AppLayout from "../components/AppLayout";

export default function Profile() {
  return (
    <AppLayout title="Profile">
      <Card>
        <p><strong>Name:</strong> Profile details will be added next.</p>
        <p><strong>Email:</strong> -</p>
        <p><strong>Created Date:</strong> -</p>
      </Card>
    </AppLayout>
  );
}