import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  User, 
  Briefcase, 
  Shield,
  Clock,
  FileText,
  Lock,
  AlertTriangle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [activeTab, setActiveTab] = useState('all');

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
        return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Denied</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getRiskLevel = (anomalyScore: number) => {
    if (anomalyScore < -0.3) return { level: 'High', color: 'bg-red-500' };
    if (anomalyScore < 0) return { level: 'Medium', color: 'bg-yellow-500' };
    return { level: 'Low', color: 'bg-green-500' };
  };

  const filteredTickets = tickets.filter(ticket => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return ticket.status === 'pending';
    if (activeTab === 'approved') return ticket.status === 'approved';
    if (activeTab === 'denied') return ticket.status === 'denied';
    return true;
  });

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Security Access Control Panel</h1>
        <p className="text-gray-500">Review and manage access requests to sensitive data</p>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Access Request Tickets</CardTitle>
                <CardDescription>Review and approve or deny access requests</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  Total: {tickets.length}
                </Badge>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  Pending: {tickets.filter(t => t.status === 'pending').length}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="mb-2">
                <TabsTrigger value="all">All Tickets</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="denied">Denied</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tickets List */}
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Request</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No tickets found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTickets.map((ticket) => {
                        const risk = getRiskLevel(ticket.mlDecision.model_outputs.anomaly_score);
                        return (
                          <TableRow key={ticket._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                                  {ticket.username.split(' ').map(word => word[0]).join('')}
                                </div>
                                <div>
                                  <div className="font-medium">{ticket.username}</div>
                                  <div className="text-sm text-gray-500">{ticket.request_details.department}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[200px] truncate font-medium">{ticket.query}</div>
                              <div className="text-sm text-gray-500">{ticket.request_details.resource_type}</div>
                            </TableCell>
                            <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div className={`h-3 w-3 rounded-full ${risk.color}`}></div>
                                <span>{risk.level}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTicket(ticket);
                                }}
                                className="h-8 px-2"
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Ticket Details */}
              {selectedTicket && (
                <Card className="overflow-hidden border-2 border-blue-100">
                  <CardHeader className="bg-blue-50 border-b border-blue-100 pb-4">
                    <div className="flex justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" /> Ticket Details
                      </CardTitle>
                      {getStatusBadge(selectedTicket.status)}
                    </div>
                    <CardDescription>
                      Created on {formatDate(selectedTicket.timestamp)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Tabs defaultValue="user">
                      <TabsList className="w-full rounded-none border-b">
                        <TabsTrigger value="user" className="flex-1">
                          <User className="h-4 w-4 mr-2" /> User
                        </TabsTrigger>
                        <TabsTrigger value="request" className="flex-1">
                          <FileText className="h-4 w-4 mr-2" /> Request
                        </TabsTrigger>
                        <TabsTrigger value="decision" className="flex-1">
                          <Shield className="h-4 w-4 mr-2" /> ML Decision
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="user" className="p-4 space-y-4">
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2 text-gray-700">
                            <User className="h-4 w-4" /> User Information
                          </h4>
                          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
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
                          <h4 className="font-medium mb-3 flex items-center gap-2 text-gray-700">
                            <Calendar className="h-4 w-4" /> Employment Details
                          </h4>
                          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
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
                      </TabsContent>

                      <TabsContent value="request" className="p-4 space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                          <p className="text-sm text-gray-500 mb-1">Query</p>
                          <p className="font-medium text-lg mb-4">{selectedTicket.query}</p>
                          
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <p className="text-sm text-gray-500">Resource Type</p>
                              <p className="font-medium">{selectedTicket.request_details.resource_type}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Resource Sensitivity</p>
                              <p className="font-medium">{selectedTicket.request_details.resource_sensitivity || "Not specified"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Request Reason</p>
                              <p className="font-medium">{selectedTicket.request_details.request_reason}</p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="decision" className="p-4 space-y-4">
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2 text-gray-700">
                            <Shield className="h-4 w-4" /> ML Decision
                          </h4>
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                selectedTicket.mlDecision.final_decision.approved 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {selectedTicket.mlDecision.final_decision.status}
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-500">Reason</p>
                            <p className="font-medium mb-4">{selectedTicket.mlDecision.final_decision.reason}</p>
                            
                            <div className="grid grid-cols-2 gap-4 mt-2">
                              <div>
                                <p className="text-sm text-gray-500">Anomaly Score</p>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{selectedTicket.mlDecision.model_outputs.anomaly_score.toFixed(4)}</span>
                                  <div className={`h-3 w-3 rounded-full ${getRiskLevel(selectedTicket.mlDecision.model_outputs.anomaly_score).color}`}></div>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Anomaly Prediction</p>
                                <p className="font-medium">{selectedTicket.mlDecision.model_outputs.anomaly_prediction}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">XGB Probability</p>
                                <p className="font-medium">{(selectedTicket.mlDecision.model_outputs.xgb_probability * 100).toFixed(2)}%</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">XGB Prediction</p>
                                <p className="font-medium">{selectedTicket.mlDecision.model_outputs.xgb_prediction}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {selectedTicket.status === 'pending' && (
                          <div>
                            <h4 className="font-medium mb-3">Admin Notes</h4>
                            <Textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="Add notes about this decision..."
                              className="mb-4"
                            />
                            
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleStatusUpdate(selectedTicket._id, 'approved')}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 flex-1"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleStatusUpdate(selectedTicket._id, 'denied')}
                                disabled={loading}
                                variant="destructive"
                                className="flex-1"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Deny
                              </Button>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>

                    <div className="px-4 pb-4 pt-2 border-t mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedTicket(null);
                          setAdminNotes('');
                        }}
                        size="sm"
                      >
                        Close
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 