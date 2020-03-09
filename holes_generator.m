clear; close all; clc;
% this script uses the inverse sampling transform method to prescribe a PDF
% and sample according to it using the inverse of the CDF.
% It tries to use chebfun, because it's fast at this, but it will fall back
% gracefully to a mostly accurate approximation using a manually
% constructed function.

% define texture size
N = 4096;
L = 6.0;

% base pixel array (N,N,RGB)
holes = zeros(N,N,3);
holes(:,:,1) = 1;

% how many holes
nholes = 10000;

% here we do the sampling
%
% p(R) ~ R^a, a=-2.75, for 0.006 cm < R < 0.08 cm
%
a = -2.75; p = @(R)(R.^a);

try
	% we will use the inverse sampling transform method through chebfun
	addpath ~/Documents/MATLAB/chebfun/
	p = chebfun(p,[0.006, 0.08]);
	density = p/sum(p);
	cdf = cumsum(density);
	cdfinv = inv(cdf);
	
	R = cdfinv(rand(nholes,1));
	
catch
	
	density = @(R)(p(R)/integral(p,0.006,0.08));
	
	fprintf('Could not find chebfun for the inverse sampling transform method. \nWill approximate with hand-tuned p(R)=R^-2.75...\n');
	p1 =     -0.1728;%  (-2.459, 2.113)
	p2 =      0.1166;%  (-1.591, 1.824)
	p3 =      0.8268;%  (-9.584, 11.24)
	p4 =      -1.114;%  (-15.31, 13.08)
	p5 =      0.2395;%  (-2.75, 3.229)
	p6 =     0.09985;%  (-1.222, 1.422)
	q1 =      -108.9;%  (-1476, 1258)
	q2 =       284.8;%  (-3344, 3913)
	q3 =      -226.4;%  (-3113, 2660)
	q4 =       32.89;%  (-372.1, 437.9)
	q5 =       16.54;%  (-202.4, 235.5)
	
	cdfinv = @(x)(p1*x.^5 + p2*x.^4 + p3*x.^3 + p4*x.^2 + p5*x + p6) ./...
					(x.^5 + q1*x.^4 + q2*x.^3 + q3*x.^2 + q4*x + q5);
	
	
	R = cdfinv(rand(nholes,1));
	
end

figure(1);
rr = linspace(0.006,0.08,1024);
plot(rr,density(rr),'-'); hold on; histogram(R,'Normalization','pdf');
legend({'PDF, $p(R) \propto R^{\alpha}$','Sampled'},'interpreter','latex');
xlabel('$R$','Interpreter','latex');
set(gca,'XScale','log','YScale','log');
drawnow();


for n=1:nholes
	
	% initially assume it's not open to force a position generation and check
	isopen = 0;
	
	% for now, make this a float
	r = R(n)*N/L;
	
	% track the number of checks per hole
	nchecks = 0;
	
	% while looking for a place to put it
	while ~isopen
		
		% position of hole
		X = randi(N);
		Y = randi(N);
		
		% assume open until shown otherwise
		isopen = 1;
		
		% cartesian grid covering hole
		for ix=X + round(-r:r)
			for iy=Y + round(-r:r)
				
				if ix >= 1 && ix <= N && iy >= 1 && iy <= N
					
					% test for within hole region
					if (ix - X)^2 + (iy - Y)^2 < ceil(r^2)
						
						% test intersection with an existing hole already in
						% texture
						if holes(ix,iy,1) < 0.5	%red channel is read by phase
							isopen = isopen*0;
						else
							isopen = isopen*1;
						end
						
					end
				end
			end
		end
		
		nchecks = nchecks+1;
		if nchecks > nholes
			fprintf('Too many checks, likely too dense hole concentration.\nTry decreasing nholes.\n');
			break;
		end
	end
	
	% now that we have a valid position and radius we make a hole
	% cartesian grid covering hole
	if isopen
		for ix=X + round(-r:r)
			for iy=Y + round(-r:r)

				if ix >= 1 && ix <= N && iy >= 1 && iy <= N

					% test for within hole region
					if (ix - X)^2 + (iy - Y)^2 < r^2

						holes(ix,iy,1) = 0; 

					end
				end
			end
		end
	end
end

% show the holes
figure(2);
imshow(holes);
drawnow();

% export the image
imwrite(holes, './app/holes.png');

% exit
exit;
