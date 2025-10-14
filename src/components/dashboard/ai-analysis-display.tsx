'use client';

import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { parseAIMarkup } from '@/lib/ai-markup';
import { useToast } from '@/hooks/use-toast';

type AIAnalysisDisplayProps = {
  analysis: string;
  prompt?: string;
  metadata?: Record<string, unknown>;
};

export function AIAnalysisDisplay({ analysis, prompt, metadata }: AIAnalysisDisplayProps) {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      // 构建复制内容
      let copyText = '# AI 分析报告\n\n';

      // 添加元数据
      if (metadata) {
        copyText += '## 分析上下文\n\n';
        Object.entries(metadata).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            copyText += `- ${key}: ${JSON.stringify(value)}\n`;
          }
        });
        copyText += '\n';
      }

      // 添加 Prompt
      if (prompt) {
        copyText += '## AI Prompt\n\n';
        copyText += '```\n';
        copyText += prompt;
        copyText += '\n```\n\n';
      }

      // 添加分析结果
      copyText += '## 分析结果\n\n';
      copyText += analysis;

      await navigator.clipboard.writeText(copyText);

      toast({
        title: '复制成功',
        description: '已将分析报告（含上下文和 Prompt）复制到剪贴板',
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('复制失败:', error);
      }
      toast({
        variant: 'destructive',
        title: '复制失败',
        description: '请稍后重试',
      });
    }
  };

  return (
    <div className="rounded-md bg-muted/50 p-3 text-sm leading-relaxed space-y-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-muted-foreground">AI 分析报告</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          onClick={handleCopy}
        >
          <Copy className="h-3.5 w-3.5 mr-1.5" />
          一键复制
        </Button>
      </div>
      <div dangerouslySetInnerHTML={{ __html: parseAIMarkup(analysis) }} />
    </div>
  );
}
