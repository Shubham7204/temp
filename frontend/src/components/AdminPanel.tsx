import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, XCircle, Calendar, User, Briefcase, Shield } from "lucide-react";

interface Ticket {
  _id: string;
  username: string;
  query: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'denied';
  mlDecision: {
    final_decision: {
      approved: boolean;
      reason: string;
      status: string;
    };
    inferred_data: {
      request_reason: string;
      resource_sensitivity: string;
      resource_type: string;
    };
    model_outputs: {
      anomaly_prediction: number;
      anomaly_score: number;
      xgb_prediction: number;
      xgb_probability: number;
    };
  };
  request_details: {
    department: string;
    employee_join_date: string;
    employee_status: string;
    last_security_training: string;
    past_violations: number;
    request_reason: string;
    resource_sensitivity: string;
    resource_type: string;
    time_in_position: string;
    user_role: string;
  };
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export function AdminPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tickets');
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleStatusUpdate = async (ticketId: string, newStatus: 'approved' | 'denied') => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes,
          reviewedBy: 'Admin', // TODO: Replace with actual admin user
        }),
      });

      if (response.ok) {
        await fetchTickets();
        setSelectedTicket(null);
        setAdminNotes('');
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800">Denied</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Access Request Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tickets List */}
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Query</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{ticket.username}</div>
                          <div className="text-sm text-gray-500">{ticket.request_details.department}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{ticket.query}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Ticket Details */}
            {selectedTicket && (
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" /> User Information
                      </h4>
                      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="font-medium">{selectedTicket.username}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Department</p>
                          <p className="font-medium">{selectedTicket.request_details.department}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Role</p>
                          <p className="font-medium">{selectedTicket.request_details.user_role}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Employment Status</p>
                          <p className="font-medium">{selectedTicket.request_details.employee_status}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Employment Details
                      </h4>
                      <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-500">Join Date</p>
                          <p className="font-medium">{formatDate(selectedTicket.request_details.employee_join_date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Time in Position</p>
                          <p className="font-medium">{selectedTicket.request_details.time_in_position}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Last Security Training</p>
                          <p className="font-medium">{selectedTicket.request_details.last_security_training}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Past Violations</p>
                          <p className="font-medium">{selectedTicket.request_details.past_violations}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Briefcase className="h-4 w-4" /> Request Details
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Query</p>
                        <p className="font-medium mb-3">{selectedTicket.query}</p>
                        <p className="text-sm text-gray-500">Resource Type</p>
                        <p className="font-medium mb-3">{selectedTicket.request_details.resource_type}</p>
                        <p className="text-sm text-gray-500">Resource Sensitivity</p>
                        <p className="font-medium">{selectedTicket.request_details.resource_sensitivity}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4" /> ML Decision
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Status</p>
                        <p className="font-medium mb-3">{selectedTicket.mlDecision.final_decision.status}</p>
                        <p className="text-sm text-gray-500">Reason</p>
                        <p className="font-medium mb-3">{selectedTicket.mlDecision.final_decision.reason}</p>
                        <p className="text-sm text-gray-500">Anomaly Score</p>
                        <p className="font-medium">{selectedTicket.mlDecision.model_outputs.anomaly_score.toFixed(4)}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Admin Notes</h4>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes about this decision..."
                        className="mb-4"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleStatusUpdate(selectedTicket._id, 'approved')}
                        disabled={loading || selectedTicket.status !== 'pending'}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate(selectedTicket._id, 'denied')}
                        disabled={loading || selectedTicket.status !== 'pending'}
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Deny
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedTicket(null);
                          setAdminNotes('');
                        }}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 