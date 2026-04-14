import { db } from '@/db';
import { marketingPosts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { approvePost, redoPost } from '../actions';
import { Check, RotateCcw, Image as ImageIcon, Twitter, Instagram, Facebook } from 'lucide-react';

export default async function PostsPage() {
  const pendingPosts = await db.select()
    .from(marketingPosts)
    .where(eq(marketingPosts.status, 'PENDING'))
    .orderBy(desc(marketingPosts.createdAt));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Post Approvals</h1>
        <p className="text-[#a1a1aa] text-sm">Review AI-generated social content. Approved posts are scheduled for tomorrow at 9:00 AM.</p>
      </div>

      <div className="grid gap-6">
        {pendingPosts.length === 0 ? (
          <div className="border border-dashed border-[#27272a] rounded-lg p-12 text-center">
            <p className="text-[#a1a1aa]">No pending posts. Great job!</p>
          </div>
        ) : (
          pendingPosts.map((post) => (
            <div key={post.id} className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 flex flex-col md:flex-row gap-6">
                {/* Preview Image */}
                <div className="w-full md:w-48 h-48 bg-[#09090b] rounded-lg flex items-center justify-center border border-[#27272a] relative overflow-hidden">
                  {post.mediaUrl ? (
                    <img src={post.mediaUrl} alt="Post content" className="object-cover w-full h-full" />
                  ) : (
                    <ImageIcon className="text-[#27272a]" size={32} />
                  )}
                  <div className="absolute top-2 left-2 p-1.5 bg-black/50 backdrop-blur-md rounded-md">
                     {post.platform === 'x' && <Twitter size={14} className="text-white" />}
                     {post.platform === 'ig' && <Instagram size={14} className="text-white" />}
                     {post.platform === 'fb' && <Facebook size={14} className="text-white" />}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {post.platform}
                      </span>
                      <span className="text-xs text-[#71717a]">
                        Generated {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-[#e4e4e7] whitespace-pre-wrap">{post.content}</p>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <form action={approvePost.bind(null, post.id)} className="flex-1">
                      <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-black hover:bg-white/90 font-bold rounded-lg transition-all active:scale-95">
                        <Check size={18} />
                        Approve for Tomorrow
                      </button>
                    </form>
                    <form action={redoPost.bind(null, post.id)}>
                      <button className="px-4 flex items-center justify-center h-full border border-[#27272a] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white rounded-lg transition-all active:scale-95">
                        <RotateCcw size={18} />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
