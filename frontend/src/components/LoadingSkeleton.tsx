// Loading Skeleton Component
export const PostCardSkeleton = () => {
    return (
        <article className="group cursor-pointer animate-pulse">
            <div className="flex items-start space-x-4">
                {/* Author avatar skeleton */}
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                    {/* Author name skeleton */}
                    <div className="h-4 bg-gray-200 rounded w-32"></div>

                    {/* Title skeleton */}
                    <div className="space-y-2">
                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    </div>

                    {/* Content skeleton */}
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>

                    {/* Meta info skeleton */}
                    <div className="flex items-center space-x-4">
                        <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                </div>
            </div>
        </article>
    );
};

export const DashboardSkeleton = () => {
    return (
        <div className="space-y-10">
            {[...Array(5)].map((_, i) => (
                <PostCardSkeleton key={i} />
            ))}
        </div>
    );
};
