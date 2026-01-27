import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, X, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_BACKEND_URL;

interface AICreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string; // 'farms', 'equipment', 'work_orders', 'inventory'
  subtype?: string; // Optional: 'crop', 'tractor', etc.
  onComplete?: (data: any) => void;
}

export function AICreationDialog({
  open,
  onOpenChange,
  entityType,
  subtype,
  onComplete,
}: AICreationDialogProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [conversation, setConversation] = useState<Array<{ question: string; answer: string }>>([]);
  const [completed, setCompleted] = useState(false);
  const [createdEntity, setCreatedEntity] = useState<any>(null);

  useEffect(() => {
    if (open && !sessionId) {
      startConversation();
    }
  }, [open]);

  const startConversation = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/ai-creation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType,
          subtype: subtype,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSessionId(data.session_id);
        setCurrentQuestion(data);
        setProgress(data.progress || 0);
      } else {
        toast.error('Failed to start AI creation');
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('Failed to start AI creation');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() && currentQuestion?.type !== 'choice') return;

    setLoading(true);
    try {
      // Add to conversation history
      setConversation(prev => [...prev, {
        question: currentQuestion.question,
        answer: answer || 'Selected option',
      }]);

      const response = await fetch(`${API_URL}/api/ai-creation/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          answer: answer,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.completed) {
          // Creation completed!
          setCompleted(true);
          setCreatedEntity(data.data);
          toast.success(data.message || 'Created successfully!');
          
          if (onComplete) {
            onComplete(data.data);
          }
        } else {
          // Next question
          setCurrentQuestion(data);
          setProgress(data.progress || 0);
          setAnswer('');
        }
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      toast.error('Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (sessionId) {
      try {
        await fetch(`${API_URL}/api/ai-creation/cancel/${sessionId}`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Failed to cancel:', error);
      }
    }
    resetDialog();
  };

  const resetDialog = () => {
    setSessionId(null);
    setCurrentQuestion(null);
    setAnswer('');
    setProgress(0);
    setConversation([]);
    setCompleted(false);
    setCreatedEntity(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    if (!completed) {
      handleCancel();
    } else {
      resetDialog();
    }
  };

  const renderInput = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'text':
        return (
          <Input
            placeholder="Type your answer..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && submitAnswer()}
            disabled={loading}
            autoFocus
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            placeholder="Enter a number..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && submitAnswer()}
            disabled={loading}
            autoFocus
          />
        );
      
      case 'choice':
        return (
          <RadioGroup value={answer} onValueChange={setAnswer}>
            <div className="space-y-2">
              {currentQuestion.options?.map((option: string) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option} className="cursor-pointer capitalize">
                    {option.replace(/_/g, ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );
      
      case 'list':
        return (
          <Input
            placeholder="Enter comma-separated values..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && submitAnswer()}
            disabled={loading}
            autoFocus
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={loading}
            autoFocus
          />
        );
      
      default:
        return (
          <Input
            placeholder="Type your answer..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && submitAnswer()}
            disabled={loading}
            autoFocus
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-600" />
            {completed ? 'Success!' : `AI Assistant - Create ${entityType.slice(0, -1)}`}
          </DialogTitle>
          <DialogDescription>
            {completed
              ? 'Your item has been created successfully'
              : 'Answer the questions and I\'ll create everything for you'}
          </DialogDescription>
        </DialogHeader>

        {!completed && progress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {completed ? (
          <div className="space-y-4 py-6">
            <div className="flex items-center justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">All Set!</h3>
              <p className="text-sm text-muted-foreground">
                Your {entityType.slice(0, -1)} has been created and is now available
              </p>
              {createdEntity && (
                <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                  <p className="text-sm font-medium">Created:</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {createdEntity.name || createdEntity.title || 'New item'}
                  </p>
                  <Badge variant="outline" className="mt-2">
                    ID: {createdEntity.id?.slice(0, 8)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Conversation History */}
            {conversation.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-2 text-sm">
                {conversation.map((item, idx) => (
                  <div key={idx} className="text-muted-foreground">
                    <span className="font-medium">Q:</span> {item.question}
                    <br />
                    <span className="font-medium">A:</span> <span className="text-foreground">{item.answer}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Current Question */}
            {currentQuestion && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-purple-900 dark:text-purple-100">
                      {currentQuestion.question}
                    </p>
                    {currentQuestion.suggestion && (
                      <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
                        💡 {currentQuestion.suggestion}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Your Answer:</Label>
                  {renderInput()}
                </div>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          {completed ? (
            <Button onClick={resetDialog} className="w-full">
              Close
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={handleCancel} disabled={loading}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={submitAnswer} disabled={loading || (!answer && currentQuestion?.type !== 'choice')}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
