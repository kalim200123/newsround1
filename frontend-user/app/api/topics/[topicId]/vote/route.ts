import { NextRequest, NextResponse } from 'next/server';

// In-memory store for vote counts, for demonstration purposes.
// This will reset every time the server restarts.
const voteCounts: Record<string, { left: number; right: number }> = {};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await context.params;
    const body = await request.json();
    const { side } = body;

    if (side !== 'LEFT' && side !== 'RIGHT') {
      return NextResponse.json({ message: 'Invalid vote side provided' }, { status: 400 });
    }

    // Initialize vote counts if they don't exist for this topic
    if (!voteCounts[topicId]) {
      voteCounts[topicId] = { left: Math.floor(Math.random() * 50) + 1, right: Math.floor(Math.random() * 50) + 1 };
    }

    // Increment the vote count for the specified side
    if (side === 'LEFT') {
      voteCounts[topicId].left += 1;
    } else {
      voteCounts[topicId].right += 1;
    }

    // Return a success response with the new (mocked) vote counts
    return NextResponse.json({
      message: '투표가 성공적으로 기록되었습니다.',
      voteCountLeft: voteCounts[topicId].left,
      voteCountRight: voteCounts[topicId].right,
    });

  } catch (error) {
    console.error('Mock Vote API Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
