"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Copy, Download, ThumbsUp, ThumbsDown, Menu, Loader2, BarChart, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart as ReBarChart,
  Bar,
  LineChart as ReLineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts"
import { AdminPanel } from "@/components/AdminPanel"

interface Message {
  id: string
  role: "assistant" | "user"
  content: string
  timestamp: string
  visualizations?: Visualization[]
  isAccessDenied?: boolean // New field to flag access denied messages
  denialReason?: string   // Reason for denial
}

interface Visualization {
  type: string
  title: string
  subtitle?: string
  xAxisLabel?: string
  yAxisLabel?: string
  growthRate?: number
  data: Array<{
    name: string
    value: number
    previousValue?: number
    category?: string
    color?: string
  }>
  timeSeriesData?: Array<{
    date: string
    value: number
  }>
}

// Define default colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#a4de6c'];

export default function App() {
  const [input, setInput] = useState("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [username, setUsername] = useState("user123") // TODO: Replace with actual user authentication
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:5000/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: userMessage.content,
          username: username // Add username to the request
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403) {
          // Handle access denied
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Access to this information has been denied.",
            timestamp: new Date().toLocaleTimeString(),
            isAccessDenied: true,
            denialReason: data.details || "No specific reason provided.",
          }
          setMessages((prev) => [...prev, assistantMessage])
        } else {
          throw new Error(data.error || "Failed to get response")
        }
      } else {
        // Handle successful response
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.textResponse,
          timestamp: new Date().toLocaleTimeString(),
        }

        // Add visualizations if available
        if (data.hasVisualizations && data.visualizations && data.visualizations.length > 0) {
          assistantMessage.visualizations = data.visualizations
        }

        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(`Failed to fetch response: ${errorMessage}. Try again.`)
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
    alert("Copied to clipboard")
  }

  // Function to render the appropriate chart based on visualization type
  const renderVisualization = (visualization: Visualization) => {
    const { type, title, subtitle, xAxisLabel, yAxisLabel, data, timeSeriesData, growthRate } = visualization
    
    return (
      <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="mb-3">
          <h4 className="font-medium text-gray-900">{title}</h4>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          {growthRate !== undefined && (
            <div className={`inline-flex items-center text-sm mt-1 px-2 py-0.5 rounded ${growthRate >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {growthRate >= 0 ? '↑' : '↓'} {Math.abs(growthRate)}% {growthRate >= 0 ? 'increase' : 'decrease'}
            </div>
          )}
        </div>
        
        <ResponsiveContainer width="100%" height={250}>
          {type === 'bar' && (
            <ReBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" label={xAxisLabel ? { value: xAxisLabel, position: 'bottom', offset: 0 } : undefined} />
              <YAxis label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'left' } : undefined} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" name={yAxisLabel || "Value"} />
              {data[0]?.previousValue !== undefined && (
                <Bar dataKey="previousValue" fill="#93c5fd" name="Previous" />
              )}
            </ReBarChart>
          )}
          
          {type === 'line' && (
            <ReLineChart data={timeSeriesData || data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={timeSeriesData ? "date" : "name"} label={xAxisLabel ? { value: xAxisLabel, position: 'bottom', offset: 0 } : undefined} />
              <YAxis label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'left' } : undefined} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" activeDot={{ r: 8 }} name={yAxisLabel || "Value"} />
            </ReLineChart>
          )}
          
          {type === 'area' && (
            <AreaChart data={timeSeriesData || data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={timeSeriesData ? "date" : "name"} label={xAxisLabel ? { value: xAxisLabel, position: 'bottom', offset: 0 } : undefined} />
              <YAxis label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'left' } : undefined} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="value" fill="#93c5fd" stroke="#3b82f6" name={yAxisLabel || "Value"} />
            </AreaChart>
          )}
          
          {type === 'pie' && (
            <RePieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RePieChart>
          )}
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <Router>
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={cn(
          "border-r bg-gray-100/40 dark:bg-gray-800/40",
          isSidebarOpen ? "w-64" : "w-16",
          "transition-all duration-300 ease-in-out"
        )}>
          <div className="flex flex-col h-full p-4">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            {isSidebarOpen && (
              <div>
                <Link to="/">
                  <Button variant="ghost" className="w-full justify-start mb-2">
                    <BarChart className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/admin">
                  <Button variant="ghost" className="w-full justify-start mb-2">
                    <Lock className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Routes>
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/" element={
              <div className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <div className="max-w-3xl mx-auto">
                    {messages.length === 0 && (
                      <div className="text-center py-10">
                        <h3 className="text-lg font-medium text-gray-700">Welcome to Enterprise RAG Chat</h3>
                        <p className="text-gray-500 mt-2">Ask a question to get started</p>
                      </div>
                    )}

                    <AnimatePresence>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={cn("flex gap-3 max-w-[90%]", message.role === "user" ? "ml-auto" : "")}
                        >
                          {message.role === "assistant" && (
                            <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold mt-1">
                              ER
                            </div>
                          )}
                          <div className="space-y-2 w-full">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{message.role === "assistant" ? "Assistant" : "You"}</span>
                              <span className="text-xs text-gray-500">{message.timestamp}</span>
                            </div>
                            <div
                              className={cn(
                                "p-4 rounded-lg",
                                message.role === "assistant"
                                  ? message.isAccessDenied
                                    ? "bg-red-50 border border-red-200 text-red-800"
                                    : "bg-white border border-gray-200 shadow-sm"
                                  : "bg-blue-600 text-white",
                              )}
                            >
                              {message.role === "assistant" ? (
                                <div className="prose prose-sm max-w-none">
                                  {message.isAccessDenied ? (
                                    <div className="flex items-start gap-2">
                                      <Lock className="h-5 w-5 mt-1" />
                                      <div>
                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                        <p className="text-sm mt-2">Reason: {message.denialReason}</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <ReactMarkdown
                                        components={{
                                          code({ node, inline, className, children, ...props }) {
                                            if (inline) {
                                              return (
                                                <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800" {...props}>
                                                  {children}
                                                </code>
                                              )
                                            }
                                            return (
                                              <div className="bg-gray-100 rounded-md p-3 my-2 overflow-auto">
                                                <code className="text-gray-800" {...props}>
                                                  {children}
                                                </code>
                                              </div>
                                            )
                                          },
                                          p({ children }) {
                                            return <p className="mb-2 last:mb-0">{children}</p>
                                          },
                                          ul({ children }) {
                                            return <ul className="list-disc pl-6 mb-2">{children}</ul>
                                          },
                                          ol({ children }) {
                                            return <ol className="list-decimal pl-6 mb-2">{children}</ol>
                                          },
                                          li({ children }) {
                                            return <li className="mb-1">{children}</li>
                                          },
                                          h1({ children }) {
                                            return <h1 className="text-xl font-bold mb-2">{children}</h1>
                                          },
                                          h2({ children }) {
                                            return <h2 className="text-lg font-bold mb-2">{children}</h2>
                                          },
                                          h3({ children }) {
                                            return <h3 className="text-md font-bold mb-2">{children}</h3>
                                          },
                                          blockquote({ children }) {
                                            return (
                                              <blockquote className="border-l-4 border-gray-200 pl-4 italic">{children}</blockquote>
                                            )
                                          },
                                        }}
                                      >
                                        {message.content}
                                      </ReactMarkdown>
                                      {message.visualizations && message.visualizations.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                          <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
                                            <BarChart className="h-4 w-4" /> Data Visualizations
                                          </h3>
                                          {message.visualizations.map((vis, index) => (
                                            <div key={`vis-${message.id}-${index}`} className="mb-6 last:mb-0">
                                              {renderVisualization(vis)}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="whitespace-pre-wrap">{message.content}</div>
                              )}
                            </div>
                            {message.role === "assistant" && !message.isAccessDenied && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full"
                                  onClick={() => copyToClipboard(message.content)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                  <ThumbsUp className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                  <ThumbsDown className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-gray-500"
                      >
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Generating response...</span>
                      </motion.div>
                    )}

                    {error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg"
                      >
                        {error}
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="border-t p-4">
                  <div className="max-w-3xl mx-auto flex gap-4">
                    <Textarea
                      ref={textareaRef}
                      placeholder="Type your message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      className="resize-none"
                    />
                    <Button onClick={handleSendMessage} disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {error && (
                    <div className="max-w-3xl mx-auto mt-2">
                      <p className="text-red-500 text-sm">{error}</p>
                    </div>
                  )}
                </div>
              </div>
            } />
          </Routes>
        </div>
      </div>
    </Router>
  )
}